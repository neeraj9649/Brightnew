// data.ts
// import bgImage from '@/assets/images/backgrounds/testi-3-1.png';
// import thumb from '@/assets/images/resources/testi--3-1.png'
// import testi1 from '@/assets/images/resources/testi--3-1.png';
// import testi2 from '@/assets/images/resources/testimonials-2-1.png';
// import testi3 from '@/assets/images/resources/testimonials-2-2.png';
// import { StaticImageData } from 'next/image';




export interface Testimonial {
  id: number;
  authorName: string;
  authorDesc: string;
  authorImage: string;
  text: string;
  rating: number;
}

export interface TestimonialsThreeData {
  bgImage: string;
  thumb: string;
  cards: Testimonial[];
}

export const testimonialsThreeData: TestimonialsThreeData = {
  bgImage: "/images/backgrounds/testi-3-1.png",
  thumb: "/images/resources/testi--3-1.png",
  cards: [
    {
      id: 1,
      authorName: "Courtney Henry",
      authorDesc: "Marketing Coordinator",
      authorImage: "/images/resources/testimonials-2-1.png",
      text: "BrightWings made our Dubai trip seamless and fun! Every tour was perfectly organized, from Desert Safari to Burj Khalifa.",
      rating: 5,
    },
    {
      id: 2,
      authorName: "Jacob Jones",
      authorDesc: "Web Designer",
      authorImage: "/images/resources/testimonials-2-2.png",
      text: "Amazing experience! BrightWings handled everything smoothly, and we loved exploring Dubai with them.",
      rating: 5,
    },
    {
      id: 3,
      authorName: "Courtney Henry",
      authorDesc: "Marketing Coordinator",
      authorImage: "/images/resources/testimonials-2-1.png",
      text: "Our family had a fantastic time in Dubai thanks to BrightWings. Great tours, friendly guides, and memorable adventures",
      rating: 5,
    },
    {
      id: 4,
      authorName: "Jacob Jones",
      authorDesc: "Web Designer",
      authorImage: "/images/resources/testimonials-2-2.png",
      text: "Consectetur adipiscing elit. Integer nunc viverra laoreet est the is porta pretium metus aliquam eget maecenas porta is nunc viverra Aenean pulvinar maximus leo",
      rating: 5,
    },
  ],
};
