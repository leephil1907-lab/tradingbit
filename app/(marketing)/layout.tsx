import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Ticker from "@/components/Ticker";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <Ticker />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
