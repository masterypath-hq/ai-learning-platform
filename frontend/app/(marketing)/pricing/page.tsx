import { PricingTable } from "@/components/PricingTable";
import { Footer } from "@/components/Footer";

export default function PricingPage() {
  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-20">
        <h1 className="text-center text-3xl font-semibold">Pricing</h1>
        <p className="mt-2 text-center text-muted">Start free. Upgrade whenever you outgrow the daily limits.</p>
        <div className="mt-10">
          <PricingTable />
        </div>
      </main>
      <Footer />
    </>
  );
}
