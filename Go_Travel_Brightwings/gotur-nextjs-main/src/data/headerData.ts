// headerData.ts

// import homeShowcase1 from "@/assets/images/home-showcase/home-showcase-1.jpg";
// import homeShowcase2 from "@/assets/images/home-showcase/home-showcase-2.jpg";
// import homeShowcase3 from "@/assets/images/home-showcase/home-showcase-3.jpg";
// import homeShowcase4 from "@/assets/images/home-showcase/home-showcase-4.jpg";
// import logoDark from "@/assets/images/logo-dark.png";
// import logoLight from "@/assets/images/logo-light.png";




export const headerData = {
  logo: {
    src: "/images/logo-dark.png",
    logoLight: "/images/logo-light.png",
    alt: "gotur HTML",
    width: 160,
    height: 45,
    link: "/",
  },
  navItems: [
    {
      label: "Home",
      link: "/",
      dropdown: [
        {
          label: "Home Page 01",
          link: "/",
          options: [
            { label: "Multi Page", link: "/" },
            { label: "One Page", link: "/index-one-page" },
            { imageSrc: "/images/home-showcase/home-showcase-1.jpg", alt: "Home Showcase 1" },
          ],
        },
        {
          label: "Home Page 02",
          link: "/home2",
          options: [
            { label: "Multi Page", link: "/home2" },
            { label: "One Page", link: "/index-2-one-page" },
            { imageSrc: "/images/home-showcase/home-showcase-2.jpg", alt: "Home Showcase 2" },
          ],
        },
      ],
    },
    {
      label: "About Us",
      link: "/about",
    },
    {
      label: "Destination",
      link: "#",
      dropdown: [
        {
          label: "Destination 01",
          link: "/destination-one",
          options: [
            { label: "Grid", link: "/destination-one" },
            { label: "Left", link: "/destination-one-left" },
            { imageSrc: "/images/home-showcase/home-showcase-3.jpg", alt: "Destination Showcase 3" },
          ],
        },
      ],
    },
    {
      label: "Contact",
      link: "/contact",
    },
  ],
  headerInfo: {
    search: { iconClass: "icon-search-interface-symbol", ariaLabel: "Search" },
    cart: { iconClass: "icon-shopping-carts", ariaLabel: "Cart" },
  },
  button: {
    label: "Get In Touch",
    link: "/contact",
    iconClass: "icon-paper-plane",
  },
};
