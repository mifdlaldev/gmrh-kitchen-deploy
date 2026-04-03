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

type MidtransSnapWithStatus = midtransClient.Snap & {
  transaction: {
    status: (
      orderId: string
    ) => Promise<{
      order_id?: string;
      transaction_status?: string;
      gross_amount?: string;
      status_code?: string;
    }>;
  };
};

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: Request, context: Context) {
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
      { error: "Konfigurasi Midtrans belum lengkap untuk verifikasi pembayaran." },
      { status: 500 }
    );
  }

  const { id } = await context.params;
  const { data: currentOrder, error: currentOrderError } = await supabase
    .from("orders")
    .select("id,customer_name,customer_email,delivery_address,total_price,status,created_at")
    .eq("id", id)
    .maybeSingle();

  if (currentOrderError) {
    return NextResponse.json(
      { error: mapOrdersErrorMessage(currentOrderError.message) },
      { status: 500 }
    );
  }

  const snap = new midtransClient.Snap({
    isProduction:
      process.env.MIDTRANS_IS_PRODUCTION === "true" ||
      isMidtransProduction(clientKey, serverKey),
    serverKey,
    clientKey,
  }) as MidtransSnapWithStatus;

  try {
    const transactionStatus = await snap.transaction.status(id);
    const status = normalizeMidtransStatus(transactionStatus.transaction_status);

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: mapOrdersErrorMessage(updateError.message) },
        { status: 500 }
      );
    }

    try {
      await syncOrderStock(supabase, id, status);
    } catch (stockError) {
      return NextResponse.json(
        {
          error:
            stockError instanceof Error
              ? stockError.message
              : "Sinkronisasi stok produk gagal diproses.",
        },
        { status: 500 }
      );
    }

    const { data: order, error: selectError } = await supabase
      .from("orders")
      .select("id,customer_name,customer_email,delivery_address,total_price,status,created_at")
      .eq("id", id)
      .maybeSingle();

    if (selectError) {
      return NextResponse.json(
        { error: mapOrdersErrorMessage(selectError.message) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      verified: true,
      status,
      order: order ?? currentOrder ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Verifikasi status Midtrans gagal diproses.";

    const normalizedMessage = message.toLowerCase();
    const isMissingMidtransTransaction =
      normalizedMessage.includes("transaction doesn't exist") ||
      normalizedMessage.includes("http status code: 404") ||
      normalizedMessage.includes('"status_code":"404"');

    if (isMissingMidtransTransaction) {
      return NextResponse.json({
        verified: false,
        status: currentOrder?.status ?? "pending",
        order: currentOrder,
      });
    }

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
