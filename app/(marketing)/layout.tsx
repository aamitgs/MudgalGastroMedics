import { CtaBand } from "@/components/site/CtaBand";
import { ConditionalPublicCareSearch } from "@/components/site/ConditionalPublicCareSearch";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { hospitalSchema } from "@/lib/site-data";

export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hospitalSchema()) }}
      />
      <Header />
      <ConditionalPublicCareSearch />
      {children}
      <CtaBand />
      <Footer />
    </>
  );
}
