import { Suspense } from "react";
import CheckoutSuccessContent from "@/components/checkout/checkout-success-content";

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#f6ecdf] py-16">
      <div className="container mx-auto max-w-4xl px-6">
        <Suspense
          fallback={
            <div className="surface-panel rounded-[2.3rem] p-8 text-center text-slate-500 md:p-10">
              Memuat status checkout...
            </div>
          }
        >
          <CheckoutSuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
