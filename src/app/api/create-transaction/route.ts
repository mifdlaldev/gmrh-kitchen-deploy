import midtransClient from "midtrans-client";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { missingSupabaseEnvMessage } from "@/lib/supabase/env";
import {
  calculateCartTotal,
  isMidtransProduction,
  mapOrdersErrorMessage,
  type CheckoutCartItem,
} from "@/lib/orders";

export async function POST(req: Request) {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json(
      { error: missingSupabaseEnvMessage },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const name = body?.name?.trim?.() ?? "";
  const phone = body?.phone?.trim?.() ?? "";
  const address = body?.address?.trim?.() ?? "";
  const bodyCustomerEmail = body?.customerEmail?.trim?.() ?? "";
  const cart = (body?.cart ?? []) as CheckoutCartItem[];

  if (!name || !phone || !address) {
    return NextResponse.json(
      { error: "Lengkapi nama, nomor telepon, dan alamat terlebih dahulu." },
      { status: 400 }
    );
  }

  if (!Array.isArray(cart) || cart.length === 0) {
    return NextResponse.json(
      { error: "Keranjang kosong. Tambahkan produk sebelum checkout." },
      { status: 400 }
    );
  }

  const invalidCartItem = cart.find(
    (item) =>
      !item.id ||
      !item.name ||
      typeof item.price !== "number" ||
      typeof item.quantity !== "number" ||
      item.quantity <= 0
  );

  if (invalidCartItem) {
    return NextResponse.json(
      { error: "Data item checkout tidak valid. Coba muat ulang halaman checkout." },
      { status: 400 }
    );
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const requestUrl = new URL(req.url);
  const originHeader = req.headers.get("origin");
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const baseUrl =
    originHeader ||
    (forwardedProto && forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : requestUrl.origin);
  if (!serverKey || !clientKey) {
    return NextResponse.json(
      {
        error:
          "Midtrans belum dikonfigurasi. Tambahkan MIDTRANS_SERVER_KEY dan NEXT_PUBLIC_MIDTRANS_CLIENT_KEY di file .env.local.",
      },
      { status: 500 }
    );
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const customerEmail =
    authUser?.email || bodyCustomerEmail || "customer@gmrh-kitchen.local";
  const orderId = crypto.randomUUID();
  const grossAmount = calculateCartTotal(cart);
  const finishUrl = `${baseUrl}/checkout/success?order_id=${encodeURIComponent(orderId)}`;
  const quantitiesByProduct = cart.reduce<Map<string, number>>((map, item) => {
    map.set(item.id, (map.get(item.id) ?? 0) + item.quantity);
    return map;
  }, new Map());

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,name,stock")
    .in("id", [...quantitiesByProduct.keys()]);

  if (productsError) {
    return NextResponse.json(
      {
        error: mapOrdersErrorMessage(productsError.message),
        details: productsError.message,
      },
      { status: 500 }
    );
  }

  const insufficientProduct = (products ?? []).find((product) => {
    const requestedQuantity = quantitiesByProduct.get(product.id) ?? 0;
    return requestedQuantity > (product.stock ?? 0);
  });

  if (insufficientProduct) {
    return NextResponse.json(
      {
        error: `Stok produk ${insufficientProduct.name} tidak cukup untuk checkout ini. Silakan muat ulang menu dan periksa jumlah pesanan Anda.`,
      },
      { status: 400 }
    );
  }

  const { error: insertOrderError } = await supabase.from("orders").insert({
    id: orderId,
    customer_name: name,
    customer_email: customerEmail,
    delivery_address: address,
    total_price: grossAmount,
    status: "pending",
  });

  if (insertOrderError) {
    return NextResponse.json(
      {
        error: mapOrdersErrorMessage(insertOrderError.message),
        details: insertOrderError.message,
      },
      { status: 500 }
    );
  }

  const { error: insertOrderItemsError } = await supabase.from("order_items").insert(
    cart.map((item) => ({
      order_id: orderId,
      product_id: item.id,
      product_name: item.name,
      product_price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
    }))
  );

  if (insertOrderItemsError) {
    await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);

    return NextResponse.json(
      {
        error: mapOrdersErrorMessage(insertOrderItemsError.message),
        details: insertOrderItemsError.message,
      },
      { status: 500 }
    );
  }

  const snap = new midtransClient.Snap({
    isProduction:
      process.env.MIDTRANS_IS_PRODUCTION === "true" ||
      isMidtransProduction(clientKey, serverKey),
    serverKey,
    clientKey,
  });

  try {
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      callbacks: {
        finish: finishUrl,
      },
      item_details: cart.map((item) => ({
        id: item.id,
        name: item.name.slice(0, 50),
        price: item.price,
        quantity: item.quantity,
      })),
      customer_details: {
        first_name: name,
        email: customerEmail,
        phone,
        shipping_address: {
          first_name: name,
          phone,
          address,
        },
      },
      custom_field1: address.slice(0, 255),
      gopay: {
        enable_callback: true,
        callback_url: finishUrl,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({
      orderId,
      snapToken: transaction.token,
      redirectUrl: transaction.redirect_url ?? null,
    });
  } catch (error) {
    await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Transaksi Midtrans gagal dibuat. Silakan coba lagi.",
      },
      { status: 500 }
    );
  }
}
