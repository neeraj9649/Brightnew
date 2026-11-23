import { StaticImageData } from 'next/image';
import { contactPhones } from "@/data/contactPhones";
import { officeAddresses } from "@/data/officeAddresses";

// import logo from "@/assets/images/logo-light.png";
// import cardImage from "@/assets/images/shapes/footer-card-1-1.png";
// import shape1 from "@/assets/images/shapes/footer-shape-1-1.png";
// import shape2 from "@/assets/images/shapes/footer-shape-1-2.png";




export interface FooterDataType {
  logo: string;
  cardImage: string;
  shape1: string;
  shape2: string;
  contact: {
    email: string;
    phones: { label: string; href: string }[];
    hours: string;
  };
  about: {
    text: string;
    lines: string[];
    socials: {
      icon: string;
      link: string;
      label: string;
    }[];
  };
  destinations: {
    title: string;
    href: string;
  }[];
  usefulLinks: {
    title: string;
    href: string;
  }[];
  newsletter: {
    text: string;
    privacyLink: string;
  };
}

export const footerOneData: FooterDataType = {
  logo: "/images/logo-light.png",
  cardImage: "/images/shapes/footer-card-1-1.png",
  shape1: "/images/shapes/footer-shape-1-1.png",
  shape2: "/images/shapes/footer-shape-1-2.png",
  contact: {
    email: "info@brightwingstravel.com",
    phones: contactPhones,
    hours: "Hours: Mon-Sat: 8am – 9pm",
  },
  about: {
    text: officeAddresses.map((a) => `${a.city}: ${a.full}`).join(" | "),
    lines: officeAddresses.map((a) => `${a.city}: ${a.full}`),
    socials: [
      { icon: "icon-facebook", link: "https://www.facebook.com/BrightwingsTravelTourism/", label: "Facebook" },
      // { icon: "fab fa-twitter", link: "https://twitter.com", label: "Twitter" },
      { icon: "fab fa-instagram", link: "https://www.instagram.com/brightwingstours/?hl=en", label: "Instagram" },
      // { icon: "icon-youtube", link: "https://youtube.com", label: "Youtube" },
    ],
  },
  destinations: [
    { title: "Dubai", href: "/allDestionation/destination-dubai" },
    { title: "Thailand", href: "/allDestionation/destination-thailand" },
    { title: "San Franc Rica", href: "/destination" },
    { title: "New York", href: "/destination" },
    { title: "Tokyo", href: "/destination" },
  ],
  usefulLinks: [
    { title: "About Us", href: "/about" },
    { title: "Destination", href: "/destination" },
    { title: "News & blog", href: "/blog-grid" },
    { title: "Meet the Guide", href: "/team" },
    { title: "Contacts", href: "/contact" },
  ],
  newsletter: {
    text: "Sign up to searing weekly newsletter to get the latest updates.",
    privacyLink: "/faq",
  },
};