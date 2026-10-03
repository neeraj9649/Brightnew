import { StaticImageData } from 'next/image';

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
    phone: string;
    hours: string;
  };
  about: {
    text: string;
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
    phone: "+91 7732957732",
    hours: "Hours: Mon-Sat: 8am – 9pm",
  },
  about: {
    text: "Office No G-2,Vinayak residency Shiv Vihar AB Lalarpura Gandhi Path West Jaipur-302021",
    socials: [
      { icon: "icon-facebook", link: "https://www.facebook.com/BrightwingsTravelTourism/", label: "Facebook" },
      // { icon: "fab fa-twitter", link: "https://twitter.com", label: "Twitter" },
      { icon: "fab fa-instagram", link: "https://www.instagram.com/brightwingstours/?hl=en", label: "Instagram" },
      // { icon: "icon-youtube", link: "https://youtube.com", label: "Youtube" },
    ],
  },
  destinations: [
    { title: "Dubai", href: "/destination-details/dubai" },
    { title: "Thailand", href: "/destination-details/thailand" },
    { title: "San Franc Rica", href: "/destination-details/san-franc-rica" },
    { title: "New York", href: "/destination-details/new-york" },
    { title: "Tokyo", href: "/destination-details/tokyo" },
  ],
  usefulLinks: [
    { title: "About Us", href: "/about" },
    { title: "Destination", href: "/destination-one" },
    { title: "News & blog", href: "/blog-grid" },
    { title: "Meet the Guide", href: "/team" },
    { title: "Contacts", href: "/contact" },
  ],
  newsletter: {
    text: "Sign up to searing weekly newsletter to get the latest updates.",
    privacyLink: "/faq",
  },
};