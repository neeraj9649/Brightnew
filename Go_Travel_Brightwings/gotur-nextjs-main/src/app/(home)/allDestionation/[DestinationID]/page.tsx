import destinationDetailsData from "@/data/destinationDetailsData";
import DestinationDetails from "./DestinationDetail";

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

  return <DestinationDetails params={resolvedParams} />;
}
