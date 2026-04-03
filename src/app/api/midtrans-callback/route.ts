import midtransClient from "midtrans-client";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncOrderStock } from "@/lib/order-fulfillment";
import { missingSupabaseEnvMessage } from "@/lib/supabase/env";
import {
  isMidtransProduction,
  mapOrdersErrorMessage,
  normalizeMidtransStatus,
} from "@/lib/orders";

type MidtransCoreApiWithNotification = midtransClient.CoreApi & {
  transaction: {
    notification: (
      payload: unknown
    ) => Promise<{
      transaction_status?: string;
    }>;
  };
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

  if (!supabase) {
    return NextResponse.json(
      { error: missingSupabaseEnvMessage },
      { status: 500 }
    );
  }

  if (!serverKey || !clientKey) {
    return NextResponse.json(
      {
        error:
          "Konfigurasi Midtrans belum lengkap, jadi callback pembayaran belum bisa diverifikasi.",
      },
      { status: 500 }
    );
  }

  const payload = await req.json().catch(() => null);
  const orderId = payload?.order_id;

  if (!orderId) {
    return NextResponse.json(
      { error: "Payload callback Midtrans tidak memiliki order_id." },
      { status: 400 }
    );
  }

  const core = new midtransClient.CoreApi({
    isProduction:
      process.env.MIDTRANS_IS_PRODUCTION === "true" ||
      isMidtransProduction(clientKey, serverKey),
    serverKey,
    clientKey,
  }) as MidtransCoreApiWithNotification;

  try {
    const transactionStatus = await core.transaction.notification(payload);
    const normalizedStatus = normalizeMidtransStatus(
      transactionStatus.transaction_status
    );

    const { error } = await supabase
      .from("orders")
      .update({ status: normalizedStatus })
      .eq("id", orderId);

    if (error) {
      return NextResponse.json(
        {
          received: true,
          verified: true,
          updated: false,
          error: mapOrdersErrorMessage(error.message),
        },
        { status: 500 }
      );
    }

    try {
      await syncOrderStock(supabase, orderId, normalizedStatus);
    } catch (stockError) {
      return NextResponse.json(
        {
          received: true,
          verified: true,
          updated: false,
          error:
            stockError instanceof Error
              ? stockError.message
              : "Sinkronisasi stok produk gagal diproses.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      received: true,
      verified: true,
      updated: true,
      orderId,
      status: normalizedStatus,
    });
  } catch (error) {
    return NextResponse.json(
      {
        received: true,
        verified: false,
        error:
          error instanceof Error
            ? error.message
            : "Callback Midtrans gagal diverifikasi.",
      },
      { status: 500 }
    );
  }
}
