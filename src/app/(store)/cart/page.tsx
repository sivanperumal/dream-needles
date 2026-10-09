import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { CartPageContent } from "@/components/cart/cart-page";

export const metadata: Metadata = {
  title: "Shopping Cart",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <div className="bg-[#fafbff] pb-20">
      <div className="container-page pt-10">
        <h1 className="text-center text-3xl font-extrabold text-[#210023] md:text-4xl">
          Shopping Cart
        </h1>
        <div className="mt-2 mb-8 flex justify-center">
          <Breadcrumbs items={[{ label: "Your Shopping Cart" }]} />
        </div>
        <CartPageContent />
      </div>
    </div>
  );
}
