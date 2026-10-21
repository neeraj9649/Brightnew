import destinationDetailsData from "@/data/destinationDetailsData";
import DestinationDetails from "./DestinationDetail";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import HeaderInner from "@/components/layout/HeaderInner/HeaderInner";
import HeaderInnerCloned from "@/components/layout/HeaderInnerCloned/HeaderInnerCloned";

export async function generateStaticParams() {
  return destinationDetailsData.map((item) => ({
    DestinationID: item.id.toString(),
  }));
}

// ✅ FIXED typing
interface DestinationPageProps {
  params: Promise<{
    DestinationID: string;
  }>;
}

export default async function DestinationPage({ params }: DestinationPageProps) {
  // ✅ Await the params, since it's now a Promise
  const resolvedParams = await params;

  return (
    <Layout>
      <TopbarOne />
      <HeaderInner />
      <HeaderInnerCloned />
      <PageHeader title="Destination Details" subTitle="Destination Details" />
      <DestinationDetails params={resolvedParams} />
      <FooterOne />
    </Layout>
  );
}
