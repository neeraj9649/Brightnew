import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import DestinationDetails from "@/app/(home)/allDestionation/[DestinationID]/page";
import HeaderInner from "@/components/layout/HeaderInner/HeaderInner";
import HeaderInnerCloned from "@/components/layout/HeaderInnerCloned/HeaderInnerCloned";
import destinationDetailsData from "@/data/destinationDetailsData";

export const metadata = {
  title: "Destination Details || Gotur || Travel & Tour NextJS Template",
  description:
    "Gotur is a modern travel & tour booking NextJS Template. It is perfect for travel agencies, tour operators, trip holiday booking websites, adventure and booking companies looking for a unique and intuitive search function and all other travel & tourism websites and businesses.",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

export async function generateStaticParams() {
  return destinationDetailsData.map((item) => ({
    DestinationID: item.id.toString(),
  }));
}

interface DestinationPageProps {
  params: {
    DestinationID: string;
  };
}

export default function DestinationDetailsPage() {
  const params = { DestinationID: "destination-dubai" }; // ✅ Add this line

  return (
    <Layout>
      <TopbarOne />
      <HeaderInner />
      <HeaderInnerCloned />
      <PageHeader title="Destination Details" subTitle="Destination Details" />
      <DestinationDetails params={params as any} /> {/* ✅ Fixed params */}
      <FooterOne />
    </Layout>
  );
}
