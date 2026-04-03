"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Package2 } from "lucide-react";
import {
  formatOrderCurrency,
  type OrderItemRecord,
} from "@/lib/orders";

type Props = {
  items: OrderItemRecord[];
  productImagesById: Record<string, string>;
  emptyMessage?: string;
};

export function OrderItemsSummary({
  items,
  productImagesById,
  emptyMessage = "Detail item belum tersedia untuk pesanan ini.",
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const totalQuantity = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  return (
    <div className="rounded-[1.4rem] bg-[#fbf5ec] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Item pesanan
          </p>
          {items.length > 0 && (
            <p className="mt-1 text-sm text-slate-500">
              {items.length} item, total {totalQuantity} produk
            </p>
          )}
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-[#eadbc9] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 transition hover:bg-[#fffaf4]"
          >
            {expanded ? (
              <>
                Tutup
                <ChevronUp className="h-4 w-4" strokeWidth={2.2} />
              </>
            ) : (
              <>
                Lihat item
                <ChevronDown className="h-4 w-4" strokeWidth={2.2} />
              </>
            )}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm leading-7 text-slate-500">{emptyMessage}</p>
      ) : expanded ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div
              key={`${item.order_id}-${item.product_id}-${item.id ?? item.product_name}`}
              className="flex items-center justify-between gap-4 rounded-[1.1rem] bg-white/80 px-3 py-2 text-sm text-slate-700"
            >
              <div className="flex min-w-0 items-center gap-3">
                {productImagesById[item.product_id] ? (
                  <div
                    className="h-11 w-11 shrink-0 rounded-xl bg-[#f4ede3] bg-cover bg-center shadow-inner"
                    style={{
                      backgroundImage: `url(${productImagesById[item.product_id]})`,
                    }}
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Img
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">
                    {item.product_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.quantity} x {formatOrderCurrency(item.product_price)}
                  </p>
                </div>
              </div>

              <span className="shrink-0 text-slate-500">
                {formatOrderCurrency(item.subtotal)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-3 rounded-[1.1rem] bg-white/70 px-3 py-3 text-sm text-slate-600">
          <Package2 className="h-4 w-4 shrink-0 text-orange-600" strokeWidth={2.2} />
          <p className="line-clamp-1">
            {items
              .slice(0, 2)
              .map((item) => `${item.product_name} x${item.quantity}`)
              .join(", ")}
            {items.length > 2 ? ` +${items.length - 2} item lain` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
