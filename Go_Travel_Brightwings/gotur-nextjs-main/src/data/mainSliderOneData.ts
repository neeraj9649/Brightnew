// import heroImage1 from "@/assets/images/main-slider/hero-1-1-image.jpg";
// import heroImage2 from "@/assets/images/main-slider/hero-1-2-image.jpg";
// import heroImage3 from "@/assets/images/main-slider/hero-1-3-image.jpg";
// import hoverImage1 from "@/assets/images/shapes/hero-1-1-hover.png";
// import hoverImage2 from "@/assets/images/shapes/hero-shapr-1-2-2.png";
// import hoverImage3 from "@/assets/images/shapes/hero-shapr-1-3.png";
// import hoverImage4 from "@/assets/images/shapes/hero-shapr-1-2-1.png";
// import hoverImage5 from "@/assets/images/shapes/hero-shapr-1-2-a.png";
// import hoverImage6 from "@/assets/images/shapes/hero-1-2-hover.png";




export const mainSliderOneData = {
  title: "Next Step \n Destination",
  subtitle: "Discover Your",
  description:
    "Travel with bright wings is not just miles crossed, but hearts touched, dreams awakened, and memories created across the world’s wonders.",
  destinations: [
    { id: 1, image: "/images/main-slider/hero-1-1-image.jpg" },
    { id: 2, image: "/images/main-slider/hero-1-2-image.jpg" },
    { id: 3, image: "/images/main-slider/hero-1-3-image.jpg" },
    { id: 4, image: "/images/main-slider/hero-1-1-image.jpg" },
    { id: 5, image: "/images/main-slider/hero-1-2-image.jpg" },
    { id: 6, image: "/images/main-slider/hero-1-3-image.jpg" },
  ],
  hoverImage: "/images/shapes/hero-1-1-hover.png",
  formFields: [
    {
      id: 1,
      name: "location",
      label: "Location",
      icon: "location",
      type: "select",
      options: [
        { id: 1, value: "australia", label: "Australia" },
        { id: 2, value: "spain", label: "Spain" },
        { id: 3, value: "africa", label: "Africa" },
        { id: 4, value: "europe", label: "Europe" },
      ],
    },
    {
      id: 2,
      name: "type",
      label: "Activities Type",
      icon: "travel",
      type: "select",
      options: [
        { id: 1, value: "adventure", label: "Adventure" },
        { id: 2, value: "booking", label: "Booking Type" },
        { id: 3, value: "beach", label: "Beach" },
        { id: 4, value: "discovery", label: "Discovery" },
      ],
    },
    {
      id: 3,
      name: "date",
      label: "Activate Day",
      icon: "clock",
      type: "text",
      placeholder: "Feb 5 - 5",
    },
    {
      id: 4,
      name: "guests",
      label: "Traveler",
      icon: "group",
      type: "number",
      value: 2,
    },
  ],
  images: [
    { id: 1, class: "", image: "/images/shapes/hero-1-2-hover.png" },
    { id: 2, class: "-one", image: "/images/shapes/hero-shapr-1-2-2.png" },
    { id: 3, class: "-two", image: "/images/shapes/hero-shapr-1-3.png" },
    { id: 4, class: "-three", image: "/images/shapes/hero-shapr-1-2-1.png" },
    { id: 6, class: "-five", image: "/images/shapes/hero-shapr-1-2-a.png" },
  ],
};
