// data.ts
// import blogImage from "@/assets/images/blog/blog-d-1-1.jpg"; // Static image import for blog main image
// import blogImg2 from "@/assets/images/blog/blog-d-1-2.jpg"; // Static image import for inner images
// import blogImg3 from "@/assets/images/blog/blog-d-1-3.jpg"; // Static image import for inner images
// import commentImg1 from "@/assets/images/blog/blog-comment-1-1.png"; // Static image for comment avatars
// import commentImg2 from "@/assets/images/blog/blog-comment-1-2.png"; // Static image for comment avatars
// import quoteImage from "@/assets/images/shapes/quote-Icon.png";

export const blogDetail = {
  title: "Get Best Advertiser in Your Side Pocket",
  date: "20 Feb, 2024",
  day: "20",
  month: "Feb",
  image: '/images/blog/blog-d-1-1.jpg', // Static image imported
  content: [
    "Consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore of magna aliqua. Ut enim ad minim veniam, made of owl the quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea dolor commodo consequat. Duis aute irure and dolor in reprehenderit.",
    "The is ipsum dolor sit amet consectetur adipiscing elit. Fusce eleifend porta arcu In hac habitasse the is platea augue thelorem turpoi dictumst. In lacus libero faucibus at malesuada sagittis placerat eros sed istincidunt augue ac ante rutrum sed the is sodales augue consequat.",
  ],
  blockQuote:
    "Pellentesque sollicitudin congue dolor non aliquam. Morbi volutpat, nisi vel ultricies urnacondimentum, sapien neque lobortis tortor, quis efficitur mi ipsum eu metus. Praesent eleifend orci sit amet est vehicula.",
  quoteImage: '/images/shapes/quote-Icon.png',
  blogImages: ['/images/blog/blog-d-1-2.jpg', '/images/blog/blog-d-1-3.jpg'],
  author: "Admin",
  category: "Travel",
  comment: "2",
  link: "blog-details",
  tags: ["Travel", "Services", "Agency"],
  comments: [
    {
      name: "Leslie Alexander",
      date: "February 10, 2024 at 2:37 pm",
      text: "Neque porro est qui dolorem ipsum quia quaed inventor veritatis et quasi architecto.",
      avatar: '/images/blog/blog-comment-1-1.png', // Static image for comment avatar
    },
    {
      name: "Ralph Edwards",
      date: "February 10, 2024 at 2:37 pm",
      text: "Neque porro est qui dolorem ipsum quia quaed inventor veritatis et quasi architecto.",
      avatar: '/images/blog/blog-comment-1-2.png', // Static image for comment avatar
    },
  ],
};
