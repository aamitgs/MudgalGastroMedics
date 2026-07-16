import { CtaBand } from "@/components/site/CtaBand";
import { ConditionalPublicCareSearch } from "@/components/site/ConditionalPublicCareSearch";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export default function MarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      <ConditionalPublicCareSearch />
      {children}
      <CtaBand />
      <Footer />
    </>
  );
}
