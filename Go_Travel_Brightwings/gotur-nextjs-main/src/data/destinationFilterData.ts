// src/data/destinationFilterData.ts
// import { StaticImageData } from 'next/image';
// import image1 from "@/assets/images/destination/destination-1-1.jpg";
// import image2 from "@/assets/images/destination/destination-1-2.jpg";
// import image3 from "@/assets/images/destination/destination-1-3.jpg";
// import image4 from "@/assets/images/destination/destination-1-4.jpg";
// import plan from "@/assets/images/shapes/plan.png";
// import monjil from "@/assets/images/shapes/monjil.png";

export interface DestinationItem {
    id: number;
    image: string ;  
    title: string;
    link: string;
  }
  
  export interface DestinationFilterData {
    subtitle: string;
    title: string;
    titleSpan: string;
    description: string;
    items: { [key: string]: DestinationItem[] };
    plan: string ;
    monjil: string ;
  }
  
export const destinationFilterData: DestinationFilterData = {
  subtitle: "Popular Destinations",
  title: "Popular",
  titleSpan: "Destinations",
  description:
    "The island of Crete offers a rare mix of splendid beaches, amazing mountain landscapes, vibrant towns and cosy villages inhabited by warm-hearted locals.",
  items: {
    Dubai: [
      { id: 1, image: "/images/destination/desert-safari-destination.png", title: "Desert", link: "/tour/desert-safari-dubai" },
      { id: 2, image: "/images/destination/dubai-aquarium-destination.png", title: "Aquarium", link: "/tour/dubai-aquarium-underwater-zoo" },
      { id: 3, image: "/images/destination/dubai-frame-destination.png", title: "Dubai Frame", link: "/tour/modern-dubai-frame" },
      { id: 4, image: "/images/destination/burj-al-arab-destination.png", title: "Burj Al Arab", link: "/tour/burj-al-arab" },
    ],
    // Thailand: [
    //   { id: 1, image: "/images/destination/destination-1-1.jpg", title: "Bangkok", link: "destination-details" },
    //   { id: 2, image: "/images/destination/destination-1-2.jpg", title: "Tokyo", link: "destination-details" },
    //   { id: 3, image: "/images/destination/destination-1-3.jpg", title: "Kashmir", link: "destination-details" },
    //   { id: 4, image: "/images/destination/destination-1-4.jpg", title: "Indonesia", link: "destination-details" },
    // ],
    // Africa: [
    //   { id: 1, image: "/images/destination/destination-1-1.jpg", title: "Bangkok", link: "destination-details" },
    //   { id: 2, image: "/images/destination/destination-1-2.jpg", title: "Tokyo", link: "destination-details" },
    //   { id: 3, image: "/images/destination/destination-1-3.jpg", title: "Kashmir", link: "destination-details" },
    //   { id: 4, image: "/images/destination/destination-1-4.jpg", title: "Indonesia", link: "destination-details" },
    // ],
    // SouthAmerica: [
    //   { id: 1, image: "/images/destination/destination-1-1.jpg", title: "Bangkok", link: "destination-details" },
    //   { id: 2, image: "/images/destination/destination-1-2.jpg", title: "Tokyo", link: "destination-details" },
    //   { id: 3, image: "/images/destination/destination-1-3.jpg", title: "Kashmir", link: "destination-details" },
    //   { id: 4, image: "/images/destination/destination-1-4.jpg", title: "Indonesia", link: "destination-details" },
    // ],
    // Australia: [
    //   { id: 1, image: "/images/destination/destination-1-1.jpg", title: "Bangkok", link: "destination-details" },
    //   { id: 2, image: "/images/destination/destination-1-2.jpg", title: "Tokyo", link: "destination-details" },
    //   { id: 3, image: "/images/destination/destination-1-3.jpg", title: "Kashmir", link: "destination-details" },
    //   { id: 4, image: "/images/destination/destination-1-4.jpg", title: "Indonesia", link: "destination-details" },
    // ],
  },
  plan: "/images/shapes/plan.png",
  monjil: "/images/shapes/monjil.png",
};



//   export const destinationFilterData: DestinationFilterData = {
//     subtitle: "Popular Destinations", 
//     title: "Popular",
//     titleSpan : "Destinations",
//     description:
//       "The island of Crete offers a rare mix of splendid beaches, amazing mountain landscapes, vibrant towns, and cozy villages inhabited by warm-hearted locals.",
//     plan: plan,
//     monjil: monjil,
//       items: [
//       {
//         id: 1,
//         image: image1,
        
//         title: "Bangkok",
//         link: "destination-details",
//       },
//       {
//         id: 2,
//         image: image2,
        
//         title: "Tokyo",
//         link: "destination-details",
//       },
//       {
//         id: 3,
//         image: image3,
       
//         title: "Kashmir",
//         link: "destination-details",
//       },
//       {
//         id: 4,
//         image: image4,
        
//         title: "Indonesia",
//         link: "destination-details",
//       },
//     ],
//   };
  