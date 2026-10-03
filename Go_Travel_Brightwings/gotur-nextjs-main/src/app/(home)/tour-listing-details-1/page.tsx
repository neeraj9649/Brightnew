import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import HeaderInner from "@/components/layout/HeaderInner/HeaderInner";
import HeaderInnerCloned from "@/components/layout/HeaderInnerCloned/HeaderInnerCloned";
import TourDetail from "../tour/[tourID]/TourDetail";

export const metadata = {
  title: "Tour Listing Details 01 || Gotur || Travel & Tour NextJS Template",
  description:
    "Gotur is a modern travel & tour booking NextJS Template. It is perfect for travel agencies, tour operators, trip holiday booking websites, adventure and booking companies looking for a unique and intuitive search function and all other travel & tourism websites and businesses.",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

// ✅ In Next.js 15+, params is a Promise
interface PageProps {
  params: Promise<{ tourID: string }>;
}

// ✅ Await params before using tourID
export default async function TourListingDetailsOnePage({ params }: PageProps) {
  const { tourID } = await params; // ✅ Awaiting is required

  return (
    <Layout>
      <TopbarOne />
      <HeaderInner />
      <HeaderInnerCloned />
      <PageHeader
        title="Tour Listing Details 01"
        subTitle="Tour Listing Details 01"
      />

      {/* ✅ Use tourID properly */}
      <TourDetail tourID={tourID} />

      <FooterOne />
    </Layout>
  );
}
