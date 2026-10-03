// data/destinationsData.ts
// import { StaticImageData } from "next/image";
// import Dest1 from "@/assets/images/resources/destinations-1-1.jpg";
// import Dest2 from "@/assets/images/resources/destinations-1-2.jpg";
// import Dest3 from "@/assets/images/resources/destinations-1-3.jpg";
// import Dest4 from "@/assets/images/resources/destinations-1-4.jpg";
// import Shape1 from "@/assets/images/shapes/des-1-1.png"; 

export interface Destination {
  id: number;
  image: string;
  title: string;
  tours: string;
  hotels: string;
  delay: string;
}

export interface SectionTitle {
  tagline: string;
  title: string;
  highlight: string;
  shape: string; 
}

export const sectionTitle: SectionTitle = {
  tagline: "Popular Destination",
  title: "Popular",
  highlight: "Destinations",
  shape: '/images/shapes/des-1-1.png'
};

export const destinationsData: Destination[] = [
  {
    id: 1,
    image: "/images/resources/destinations-1-1.jpg",
    title: "Matera, Italy",
    tours: "5 Tour+",
    hotels: "1 Hotel",
    delay: "100ms",
  },
  {
    id: 2,
    image: "/images/resources/destinations-1-2.jpg",
    title: "Ronda, Spain",
    tours: "5 Tour+",
    hotels: "1 Hotel",
    delay: "300ms",
  },
  {
    id: 3,
    image: "/images/resources/destinations-1-3.jpg",
    title: "Sintra, Portugal",
    tours: "5 Tour+",
    hotels: "1 Hotel",
    delay: "500ms",
  },
  {
    id: 4,
    image: "/images/resources/destinations-1-4.jpg",
    title: "Cesky, Krumlov",
    tours: "5 Tour+",
    hotels: "1 Hotel",
    delay: "700ms",
  },
];