import tourDetailsOneData from "@/data/tourDetailsOneData";
import TourDetail from "./TourDetail";

// ✅ Generate static params for all tours
export async function generateStaticParams() {
  return tourDetailsOneData.map((tour) => ({
    tourID: tour.id.toString(),
  }));
}

interface PageProps {
  params: Promise<{ tourID: string }>;
}

// ✅ Await params (Next.js 15 requirement)
export default async function Page({ params }: PageProps) {
  const { tourID } = await params;

  return <TourDetail tourID={tourID} />;
}
