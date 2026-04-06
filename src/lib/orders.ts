export type CheckoutCartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

export type OrderRecord = {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  delivery_address: string | null;
  total_price: number | null;
  status: string | null;
  created_at: string | null;
};

export type OrderItemRecord = {
  id?: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_price: number | null;
  quantity: number;
  subtotal: number | null;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export const orderStatusOptions: Array<{
  value: OrderStatus;
  label: string;
  description: string;
}> = [
  {
    value: "pending",
    label: "Menunggu",
    description: "Order baru masuk dan masih menunggu pembayaran.",
  },
  {
    value: "confirmed",
    label: "Lunas",
    description: "Pembayaran terverifikasi dan order siap masuk proses dapur.",
  },
  {
    value: "preparing",
    label: "Diproses",
    description: "Pesanan sedang disiapkan oleh tim dapur.",
  },
  {
    value: "ready",
    label: "Siap kirim",
    description: "Pesanan sudah siap diantar ke pelanggan.",
  },
  {
    value: "delivered",
    label: "Selesai",
    description: "Pesanan telah diterima pelanggan dan proses selesai.",
  },
  {
    value: "cancelled",
    label: "Dibatalkan",
    description: "Pesanan dibatalkan dan tidak dilanjutkan.",
  },
];

type AdminOrderAction = {
  label: string;
  nextStatus: OrderStatus;
};

const missingOrdersTablePatterns = [
  "could not find the table 'public.orders' in the schema cache",
  'relation "public.orders" does not exist',
  'relation "orders" does not exist',
  "could not find the table 'public.order_items' in the schema cache",
  'relation "public.order_items" does not exist',
  'relation "order_items" does not exist',
];

const ordersRlsPatterns = [
  'new row violates row-level security policy for table "orders"',
  'permission denied for table orders',
  'violates row-level security policy for table "orders"',
  'cannot coerce the result to a single json object',
];

export function calculateCartTotal(items: CheckoutCartItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function isMidtransProduction(clientKey?: string | null, serverKey?: string | null) {
  if (!clientKey && !serverKey) {
    return false;
  }

  const keys = [clientKey, serverKey].filter(Boolean) as string[];

  return keys.every((key) => !key.startsWith("SB-"));
}

export function normalizeMidtransStatus(status?: string | null) {
  switch (status) {
    case "capture":
    case "settlement":
      return "confirmed";
    case "pending":
      return "pending";
    case "deny":
    case "cancel":
    case "expire":
    case "failure":
      return "cancelled";
    default:
      return "pending";
  }
}

export function isPaidOrderStatus(status?: string | null) {
  return ["confirmed", "preparing", "ready", "delivered"].includes(
    status ?? ""
  );
}

export function isFinalOrderStatus(status?: string | null) {
  return ["delivered", "cancelled"].includes(status ?? "");
}

export function canCancelOrder(status?: string | null) {
  return ["pending", "confirmed", "preparing", "ready"].includes(status ?? "");
}

export function getAdminOrderPrimaryAction(
  status?: string | null
): AdminOrderAction | null {
  switch (status) {
    case "confirmed":
      return {
        label: "Mulai Proses",
        nextStatus: "preparing",
      };
    case "preparing":
      return {
        label: "Siap Kirim",
        nextStatus: "ready",
      };
    case "ready":
      return {
        label: "Selesaikan",
        nextStatus: "delivered",
      };
    default:
      return null;
  }
}

export function getOrderStatusLabel(status?: string | null) {
  switch (status) {
    case "confirmed":
      return "Lunas";
    case "preparing":
      return "Diproses";
    case "ready":
      return "Siap kirim";
    case "delivered":
      return "Selesai";
    case "cancelled":
      return "Dibatalkan";
    case "pending":
    default:
      return "Menunggu";
  }
}

export function getOrderStatusClasses(status?: string | null) {
  switch (status) {
    case "confirmed":
    case "delivered":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "preparing":
    case "ready":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700";
    case "pending":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export function formatOrderCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function groupOrderItemsByOrderId(items: OrderItemRecord[]) {
  return items.reduce<Record<string, OrderItemRecord[]>>((groups, item) => {
    const currentItems = groups[item.order_id] ?? [];
    currentItems.push(item);
    groups[item.order_id] = currentItems;
    return groups;
  }, {});
}

export function mapOrdersErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  const isMissingTable = missingOrdersTablePatterns.some((pattern) =>
    normalized.includes(pattern)
  );

  if (isMissingTable) {
    return "Tabel order di database belum lengkap. Pastikan tabel `orders` dan `order_items` sudah ada dan bisa diakses sebelum mengelola data pesanan.";
  }

  const isRlsError = ordersRlsPatterns.some((pattern) =>
    normalized.includes(pattern)
  );

  if (isRlsError) {
    return "Tabel orders sudah ada, tetapi policy orders di Supabase belum lengkap untuk membaca atau menulis data checkout. Jalankan ulang migration `supabase/migrations/20260403_enable_orders_checkout_policies.sql` di Supabase SQL Editor lalu coba lagi.";
  }

  return message;
}
