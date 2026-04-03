import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { missingSupabaseEnvMessage } from "@/lib/supabase/env";
import { syncOrderStock } from "@/lib/order-fulfillment";
import { mapOrdersErrorMessage, normalizeMidtransStatus } from "@/lib/orders";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(req: Request, context: Context) {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json(
      { error: missingSupabaseEnvMessage },
      { status: 500 }
    );
  }

  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  const requestedStatus = body?.status;

  const allowedManualStatuses = new Set([
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "delivered",
    "cancelled",
  ]);
  const midtransStatuses = new Set([
    "capture",
    "settlement",
    "pending",
    "deny",
    "cancel",
    "expire",
    "failure",
  ]);

  let status: string | null = null;

  if (typeof requestedStatus === "string") {
    if (allowedManualStatuses.has(requestedStatus)) {
      status = requestedStatus;
    } else if (midtransStatuses.has(requestedStatus)) {
      status = normalizeMidtransStatus(requestedStatus);
    }
  }

  if (!status) {
    return NextResponse.json(
      { error: "Status order tidak valid." },
      { status: 400 }
    );
  }

  const adminManagedStatuses = new Set(["preparing", "ready", "delivered"]);

  if (adminManagedStatuses.has(status)) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login sebagai admin untuk mengubah status ini." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: mapOrdersErrorMessage(profileError.message) },
        { status: 500 }
      );
    }

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Hanya admin yang boleh melanjutkan proses pesanan." },
        { status: 403 }
      );
    }
  }

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: mapOrdersErrorMessage(error.message) },
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

  return NextResponse.json({
    updated: true,
    id,
    status,
  });
}
