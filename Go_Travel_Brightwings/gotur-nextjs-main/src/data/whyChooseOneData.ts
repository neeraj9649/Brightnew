// import { StaticImageData } from 'next/image';
import image1 from '@/assets/images/about/about-s-8-2.jpg'; 
import image2 from '@/assets/images/about/about-s-8-1.jpg'; 
import image3 from "@/assets/images/about/about-8-1.jpg"
import perasut from "@/assets/images/shapes/perasut-1-1.png";


export interface WhyChooseItem {
  icon: string;
  title: string;
  delay: string;
}

export interface WhyChooseOneData {
  title: string;
  subtitle: string;
  description: string;
  image: string; 
  imageSmall: string; 
  image3: string;
  perasut: string;
  items: WhyChooseItem[];
}

export const whyChooseOneData: WhyChooseOneData = {
  title: "Why Choose Us",
  subtitle: "Get The Best Travel Experience With Gotur",
  description:
    "It is a long established fact that a reader will be distracted the readable content of a page when looking at layout the point.",
  image: "/images/about/about-s-8-2.jpg",
  imageSmall: "/images/about/about-s-8-1.jpg",
  image3: "/images/about/about-8-1.jpg",
  perasut: "/images/shapes/perasut-1-1.png",
  items: [
    { icon: "icon-flag", title: "Trusted travel guide", delay: "100ms" },
    { icon: "icon-calender", title: "Instant Booking", delay: "200ms" },
    { icon: "icon-travle1", title: "World Class Travel", delay: "300ms" },
    { icon: "icon-perasut", title: "Paragliding Tour", delay: "400ms" },
  ],
};
