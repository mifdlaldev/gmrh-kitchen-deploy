import { isPaidOrderStatus, mapOrdersErrorMessage } from "@/lib/orders";

type SupabaseClientLike = {
  from: (table: string) => {
    select: (columns: string) => unknown;
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

type OrderItemRow = {
  product_id: string;
  quantity: number;
};

type ProductStockRow = {
  id: string;
  stock: number | null;
};

async function getOrderSnapshot(supabase: SupabaseClientLike, orderId: string) {
  const query = (
    supabase.from("orders").select("id,status,stock_deducted")
  ) as {
    eq: (column: string, value: string) => {
      maybeSingle: () => Promise<{
        data: unknown;
        error: { message: string } | null;
      }>;
    };
  };

  const { data, error } = await query.eq("id", orderId).maybeSingle();

  if (error) {
    throw new Error(mapOrdersErrorMessage(error.message));
  }

  return data as
    | {
        id: string;
        status: string | null;
        stock_deducted: boolean | null;
      }
    | null;
}

async function getOrderItems(supabase: SupabaseClientLike, orderId: string) {
  const query = (
    supabase.from("order_items").select("product_id,quantity")
  ) as {
    eq: (column: string, value: string) => Promise<{
      data: unknown[] | null;
      error: { message: string } | null;
    }>;
  };

  const { data, error } = await query.eq("order_id", orderId);

  if (error) {
    throw new Error(mapOrdersErrorMessage(error.message));
  }

  return (data ?? []) as OrderItemRow[];
}

async function getProductsByIds(
  supabase: SupabaseClientLike,
  productIds: string[]
) {
  const query = (
    supabase.from("products").select("id,stock")
  ) as {
    in: (column: string, values: string[]) => Promise<{
      data: unknown[] | null;
      error: { message: string } | null;
    }>;
  };

  const { data, error } = await query.in("id", productIds);

  if (error) {
    throw new Error(mapOrdersErrorMessage(error.message));
  }

  return (data ?? []) as ProductStockRow[];
}

function aggregateQuantities(items: OrderItemRow[]) {
  return items.reduce<Map<string, number>>((map, item) => {
    map.set(item.product_id, (map.get(item.product_id) ?? 0) + item.quantity);
    return map;
  }, new Map<string, number>());
}

async function updateProductStocks(
  supabase: SupabaseClientLike,
  products: ProductStockRow[],
  quantities: Map<string, number>,
  direction: "decrease" | "increase"
) {
  for (const product of products) {
    const quantity = quantities.get(product.id) ?? 0;
    const currentStock = product.stock ?? 0;
    const nextStock =
      direction === "decrease"
        ? Math.max(currentStock - quantity, 0)
        : currentStock + quantity;

    const { error } = await supabase
      .from("products")
      .update({ stock: nextStock })
      .eq("id", product.id);

    if (error) {
      throw new Error(mapOrdersErrorMessage(error.message));
    }
  }
}

export async function syncOrderStock(
  supabase: unknown,
  orderId: string,
  nextStatus: string
) {
  const client = supabase as SupabaseClientLike;
  const order = await getOrderSnapshot(client, orderId);

  if (!order) {
    return;
  }

  const isPaid = isPaidOrderStatus(nextStatus);
  const hasStockDeducted = Boolean(order.stock_deducted);

  if (isPaid === hasStockDeducted) {
    return;
  }

  const items = await getOrderItems(client, orderId);

  if (items.length === 0) {
    return;
  }

  const quantities = aggregateQuantities(items);
  const products = await getProductsByIds(client, [...quantities.keys()]);

  await updateProductStocks(
    client,
    products,
    quantities,
    isPaid ? "decrease" : "increase"
  );

  const { error } = await client
    .from("orders")
    .update({ stock_deducted: isPaid })
    .eq("id", orderId);

  if (error) {
    throw new Error(mapOrdersErrorMessage(error.message));
  }
}
