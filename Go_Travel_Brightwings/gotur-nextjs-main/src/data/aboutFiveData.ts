import { StaticImageData } from "next/image";

import mainImg from "/images/about/about-5-1.jpg";
import smallImg from "/images/about/about-s-5-1.jpg";
import shapeOverlay from "/images/shapes/about-5-3.png";
import shapeOne from "/images/shapes/about-5-1.png";
import shapeTwo from "/images/shapes/about-5-2.png";
import authorImg from "/images/resources/about-author-1-1.jpg";

export interface AboutFiveFeature {
  icon: string;
  title: string;
  description: string;
  delay: string;
}

export interface AboutFiveData {
  sectionTagline: string;
  sectionTitle: string;
  sectionHighlight: string;
  sectionLast: string;
  description: string;
  videoUrl: string;
  mainImage: StaticImageData;
  smallImage: StaticImageData;
  shapeOverlay: StaticImageData;
  shapeOne: StaticImageData;
  shapeTwo: StaticImageData;
  features: AboutFiveFeature[];
  buttonText: string;
  buttonUrl: string;
  authorImage: StaticImageData;
  authorName: string;
  authorRole: string;
}

export const aboutFiveData: AboutFiveData = {
  sectionTagline: "About Gotur",
  sectionTitle: "Experience The Mew",
  sectionHighlight: "Adventure",
  sectionLast: "With Us",
  description:
    "It is a long established fact that a reader will be distracted the readable content of a page when looking at layout the point.",
  videoUrl: "0MuL8fd3pb8",
  mainImage: mainImg,
  smallImage: smallImg,
  shapeOverlay,
  shapeOne,
  shapeTwo,
  features: [
    {
      icon: "icon-flag",
      title: "Trusted travel guide",
      description: "Pellentesque ut vehicula sapien dictumst. Maecenas ante.",
      delay: "300ms",
    },
    {
      icon: "icon-calender",
      title: "Instant Booking",
      description: "Pellentesque ut vehicula sapien dictumst. Maecenas ante.",
      delay: "400ms",
    },
  ],
  buttonText: "Discover More",
  buttonUrl: "blog-details-left",
  authorImage: authorImg,
  authorName: "Ronald Richards",
  authorRole: "Co, Founder",
};
