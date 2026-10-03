// import bg from "@/assets/images/backgrounds/cta-1-1.jpg";
// import shape from "@/assets/images/shapes/cta-1-1.png";
import { StaticImageData } from "next/image";

export interface FunFact {
    iconClass: string;
    count: number;
    suffix: string;
    label: string;
  }
  export interface FunFactData {
    bg: StaticImageData
    shape: StaticImageData;
 
  }
  
  export const funFacts: FunFact[] = [
    { iconClass: "icon-travel-and-tourism", count: 30, suffix: "k+", label: "Tours success" },
    { iconClass: "icon-tourist", count: 6500, suffix: "+", label: "Happy Traveler" },
    { iconClass: "icon-trophy", count: 6561, suffix: "+", label: "Awards Winning" },
    { iconClass: "icon-quality", count: 25, suffix: "+", label: "Our Experience" },
    
  ];

export const funFactSectionConfig = {
    bgImage: '/images/backgrounds/cta-1-1.jpg',
    shapeImage: '/images/shapes/cta-1-1.png',
  };
  