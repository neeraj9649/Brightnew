import tourDetailsOneData from "@/data/tourDetailsOneData";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import HeaderInner from "@/components/layout/HeaderInner/HeaderInner";
import HeaderInnerCloned from "@/components/layout/HeaderInnerCloned/HeaderInnerCloned";
import TourDetail from "./TourDetail";

// Page files are built for the original tours, plus /tour/_/: nginx serves that one for tours
// added later in the admin portal (see docs/website-tours-blog.md). The page itself loads the tour
// from the API by the slug in the address, so every tour shows its own data either way.
export async function generateStaticParams() {
  return [...tourDetailsOneData.map((tour) => ({ tourID: tour.id.toString() })), { tourID: "_" }];
}

interface PageProps {
  params: Promise<{ tourID: string }>;
}

// ✅ Await params (Next.js 15 requirement)
// Same frame as every other page: top bar, navbar (plus its sticky copy), banner, footer.
export default async function Page({ params }: PageProps) {
  const { tourID } = await params;

  return (
    <Layout>
      <TopbarOne />
      <HeaderInner />
      <HeaderInnerCloned />
      <PageHeader title='Tour Details' subTitle='Tour Details' />
      <TourDetail tourID={tourID} />
      <FooterOne />
    </Layout>
  );
}
