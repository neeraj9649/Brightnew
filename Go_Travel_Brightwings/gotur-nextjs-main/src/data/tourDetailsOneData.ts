// import sliderImage1 from "@/assets/images/backgrounds/destination-slider-1-1.jpg";
// import sliderImage2 from "@/assets/images/backgrounds/destination-slider-1-2.jpg";
// import sliderImage3 from "@/assets/images/backgrounds/destination-slider-1-3.jpg";
// import sliderImage4 from "@/assets/images/backgrounds/destination-slider-1-4.jpg";
// import slider2Image1 from "@/assets/images/gallery/listing-list-g-1-1.jpg";
// import slider2Image2 from "@/assets/images/gallery/listing-list-g-1-2.jpg";
// import slider2Image3 from "@/assets/images/gallery/listing-list-g-1-3.jpg";
// import slider2Image4 from "@/assets/images/gallery/listing-list-g-1-4.jpg";
// import slider2Image5 from "@/assets/images/gallery/listing-list-g-1-5.jpg";
// import img1 from "@/assets/images/resources/tour-listing-details-1-1.jpg";
// import img2 from "@/assets/images/resources/tour-listing-details-1-2.jpg";
// import tour1 from "@/assets/images/blog/listing-list-4-1.jpg";
// import tour2 from "@/assets/images/blog/listing-list-4-2.jpg";
// import commentImg1 from "@/assets/images/blog/blog-comment-1-1.png";

const tourDetailsOneData = [
  {
    id: "burj-khalifa",
    title:
      "The tallest building in the world with breathtaking observation decks.",
    reviews: 17,
    location: "Dubai",
    activitiesType: "Adventure",
    traveler: 1,
    activateDay: "Feb 5 - 5",
    price: "Contact Us ",
    overviewTitle: "Overview",
    titleTwo: "Highlight List",
    overview:
      "The world’s tallest building,offers breathtaking panoramic views from its observation decks. A symbol of Dubai’s modern skyline, it’s a must-visit for anyone wanting a glimpse of the city from above.",
    topDestinations:
      "The world’s tallest building,offers breathtaking panoramic views from its observation decks. A symbol of Dubai’s modern skyline, it’s a must-visit for anyone wanting a glimpse of the city from above.",
    sliderImages: [
      "/images/sliderImage/burj-khalifa-slide-1.jpeg",
      "/images/sliderImage/burj-khalifa-slide-2.png",
      "/images/sliderImage/burj-khalifa-slide-3.png",
      "/images/sliderImage/burj-khalifa-slide-4.png",
    ],
    slider2Images: [
      "/images/gallery/listing-list-g-1-1.jpg",
      "/images/gallery/listing-list-g-1-2.jpg",
      "/images/gallery/listing-list-g-1-3.jpg",
      "/images/gallery/listing-list-g-1-4.jpg",
      "/images/gallery/listing-list-g-1-5.jpg",
    ],
    images: [
      "/images/resources/burj-khalifa-suggestion1.jpeg",
      "/images/resources/burj-khalifa-suggestion2.png",
    ],
    highlightList: [
      "Atmosphere Restaurant",
      "The Burj Khalifa Fountains",
      "Observation Decks",
      "The Lounge",
      "Special Events & Tours",
      "Interactive Experiences",
    ],
    amenities: [
      "Cruise Dinner & Music Event",
      "Pick and Drop Services",
      "Additional Services",
      "Specialized bilingual guide",
      "Food and Drinks",
    ],
    amenitiesTwo: [
      "Cruise Dinner & Music Event",
      "Pick and Drop Services",
      "Additional Services",
      "Specialized bilingual guide",
      "Food and Drinks",
    ],
    comments: [
      {
        name: "Leslie Alexander",
        date: "February 10, 2024 at 2:37 pm",
        text: "Visiting Burj Khalifa was unforgettable! The views from the observation deck are absolutely breathtaking, offering a stunning panorama of Dubai’s skyline and desert. The experience of being at the world’s tallest building is truly surreal.",
        avatar: "/images/blog/blog-comment-1-1.png",
        rating: 4,
      },
    ],
    relatedTours: [
      {
        id: 1,
        image: "/images/tourImages/desert-safari-dubai.png",
        title: "Desert Safari Dubai",
        link: "desert-safari-dubai",
        price: "Contact Us",
        rating: 5,
        reviews: 10,
        videoId: "0MuL8fd3pb8",
        discount: "",
        meta: [
          { id: 1, icon: "icon-pin1", title: "Dubai" },
          { id: 2, icon: "icon-calendar", title: "1 Day" },
        ],
      },
      {
        id: 2,
        image: "/images/tourImages/the-modern-dubai-frame.png",
        title: "The modern Dubai Frame",
        link: "modern-dubai-frame",
        price: "Contact Us",
        rating: 4,
        reviews: 8,
        videoId: "GTn2EKD-cfg",
        discount: "40",
        meta: [
          { id: 1, icon: "icon-pin1", title: "Dubai" },
          { id: 2, icon: "icon-calendar", title: "1 Day" },
        ],
      },
    ],
    faqs: [
      {
        question: "How long should a business plan be?",
        answer:
          "Nulla facilisi. Vestibulum tristique sem in eros eleifend imperdiet. Donec quis convallis neque. In id lacus pulvinar lacus, eget vulputate lectus. Ut viverra bibendum lorem, at tempus nibh mattis in. Sed a massa eget lacus consequat auctor.",
      },
      {
        question: "What is included in your services?",
        answer:
          "Nulla facilisi. Vestibulum tristique sem in eros eleifend imperdiet. Donec quis convallis neque. In id lacus pulvinar lacus, eget vulputate lectus. Ut viverra bibendum lorem, at tempus nibh mattis in. Sed a massa eget lacus consequat auctor.",
      },
      {
        question: "What type of company is measured?",
        answer:
          "Nulla facilisi. Vestibulum tristique sem in eros eleifend imperdiet. Donec quis convallis neque. In id lacus pulvinar lacus, eget vulputate lectus. Ut viverra bibendum lorem, at tempus nibh mattis in. Sed a massa eget lacus consequat auctor.",
      },
    ],
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.1786541102892!2d55.27180147597446!3d25.19719697771102!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f43348a67e24b%3A0xff45e502e1ceb7e2!2sBurj%20Khalifa!5e0!3m2!1sen!2sin!4v1760871030062!5m2!1sen!2sin",
  },
  {
    id: "dubai-mall",
    title:
      "The Dubai Mall - One of the largest malls in the world with shops, an aquarium, and an ice rink.",
    reviews: 17,
    location: "Dubai",
    activitiesType: "Adventure",
    traveler: 1,
    activateDay: "Feb 5 - 5",
    price: "Contact Us",
    overviewTitle: "Overview",
    titleTwo: "Highlight List",
    overview:
      "The Dubai Mall, one of the largest shopping destinations in the world, offers far more than just retail therapy. Beyond its countless luxury and high-street stores, visitors can immerse themselves in a world of entertainment, from the mesmerizing Dubai Aquarium & Underwater Zoo to the fun-filled VR Park and the Olympic-sized Ice Rink. Food lovers can enjoy a wide variety of dining options, from casual cafés to gourmet restaurants. Whether you’re shopping, exploring, or enjoying family-friendly attractions, The Dubai Mall promises a full day of unforgettable experiences for visitors of all ages",
    topDestinations:
      "The Dubai Mall, one of the largest shopping destinations in the world, offers far more than just retail therapy. Beyond its countless luxury and high-street stores, visitors can immerse themselves in a world of entertainment, from the mesmerizing Dubai Aquarium & Underwater Zoo to the fun-filled VR Park and the Olympic-sized Ice Rink. Food lovers can enjoy a wide variety of dining options, from casual cafés to gourmet restaurants. Whether you’re shopping, exploring, or enjoying family-friendly attractions, The Dubai Mall promises a full day of unforgettable experiences for visitors of all ages",
    sliderImages: [
      "/images/sliderImage/dubai-mall-slide-1.png",
      "/images/sliderImage/dubai-mall-slide-2.png",
      "/images/sliderImage/dubai-mall-slide-3.png",
      "/images/sliderImage/dubai-mall-slide-4.png",
    ],
    slider2Images: [
      "/images/gallery/listing-list-g-1-1.jpg",
      "/images/gallery/listing-list-g-1-2.jpg",
      "/images/gallery/listing-list-g-1-3.jpg",
      "/images/gallery/listing-list-g-1-4.jpg",
      "/images/gallery/listing-list-g-1-5.jpg",
    ],
    images: [
      "/images/resources/dubai-mall-suggestion-1.png",
      "/images/resources/dubai-mall-suggestion-2.png",
    ],
    highlightList: [
      "Dubai Aquarium & Underwater Zoo",
      "VR Park & Indoor Theme Attractions",
      "Fashion & Luxury Shopping",
      "Souk & Specialty Zones",
      "KidZania",
      "Reel Cinemas",
      "Gourmet Dining & Cafes",
      "The Dubai Mall Waterfalls & Indoor Features",
    ],
    amenities: [
      "Cruise Dinner & Music Event",
      "Pick and Drop Services",
      "Additional Services",
      "Specialized bilingual guide",
      "Food and Drinks",
    ],
    amenitiesTwo: [
      "Cruise Dinner & Music Event",
      "Pick and Drop Services",
      "Additional Services",
      "Specialized bilingual guide",
      "Food and Drinks",
    ],
    comments: [
      {
        name: "Leslie Alexander",
        date: "February 10, 2024 at 2:37 pm",
        text: "The Dubai Mall is amazing! It has everything – from high-end shopping to incredible attractions like the Dubai Aquarium and the indoor waterfall. The food courts and entertainment options make it perfect for a full day out. Truly a must-visit in Dubai!",
        avatar: "/images/blog/blog-comment-1-1.png",
        rating: 4,
      },
    ],
    relatedTours: [
      {
        id: 1,
        image: "/images/tourImages/burj-khalifa.jpeg",
        title: "The Burj Khalifa",
        link: "burj-khalifa",
        price: "Contact Us",
        rating: 5,
        reviews: 10,
        videoId: "0MuL8fd3pb8",
        discount: "",
        meta: [
          { id: 1, icon: "icon-pin1", title: "Dubai" },
          { id: 2, icon: "icon-calendar", title: "1 Day" },
        ],
      },
      {
        id: 2,
        image: "/images/tourImages/jumeirah-beach.png",
        title: "The Jumeirah Beach",
        link: "jumeirah-beach",
        price: "Contact Us",
        rating: 4,
        reviews: 8,
        videoId: "GTn2EKD-cfg",
        discount: "40",
        meta: [
          { id: 1, icon: "icon-pin1", title: "Dubai" },
          { id: 2, icon: "icon-calendar", title: "1 Day" },
        ],
      },
    ],
    faqs: [
      {
        question: "Where is The Dubai Mall located?",
        answer:
          "The Dubai Mall is located in Downtown Dubai, right next to the iconic Burj Khalifa.",
      },
      {
        question: "Is there an entry fee to visit The Dubai Mall?",
        answer:
          "No, entry to the mall is free. However, attractions inside, like the Dubai Aquarium, Ice Rink, and VR Park, have separate ticket fees.",
      },
      {
        question: "What shopping options are available?",
        answer:
          "The mall offers over 1,200 stores, including luxury brands like Chanel and Gucci, high-street favorites like Zara and H&M, and unique boutique shops.",
      },
      {
        question: "What are the opening hours?",
        answer:
          "The mall is generally open from 10:00 AM to 12:00 AM (midnight), but individual stores and attractions may have different hours.",
      },
    ],
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.171509330427!2d55.27692297597464!3d25.19743797771086!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f682829c85c07%3A0xa5eda9fb3c93b69d!2sDubai%20Mall!5e0!3m2!1sen!2sin!4v1760871095408!5m2!1sen!2sin",
  },
  {
    id: "jumeirah-beach",
    title: "Jumeirah Beach – Dubai’s Iconic White Sands & Crystal Waters",
    reviews: 17,
    location: "Dubai",
    activitiesType: "Adventure",
    traveler: 1,
    activateDay: "Feb 5 - 5",
    price: "Contact Us ",
    overviewTitle: "Overview",
    titleTwo: "Highlight List",
    overview:
      "Jumeirah Beach, Dubai’s most famous shoreline, offers a perfect blend of relaxation and adventure. With its soft white sands, crystal-clear waters, and stunning views of the iconic Burj Al Arab, it’s an ideal spot for sunbathing, swimming, and watersports. Whether you’re seeking a serene escape or thrilling activities, Jumeirah Beach promises an unforgettable experience.",
    topDestinations:
      "Jumeirah Beach, Dubai’s most famous shoreline, offers a perfect blend of relaxation and adventure. With its soft white sands, crystal-clear waters, and stunning views of the iconic Burj Al Arab, it’s an ideal spot for sunbathing, swimming, and watersports. Whether you’re seeking a serene escape or thrilling activities, Jumeirah Beach promises an unforgettable experience.",
    sliderImages: [
      "/images/sliderImage/jumeirah-beach-slider-1.png",
      "/images/sliderImage/jumeirah-beach-slider-2.png",
      "/images/sliderImage/jumeirah-beach-slider-3.png",
      "/images/sliderImage/jumeirah-beach-slider-4.png",
    ],
    slider2Images: [
      "/images/gallery/listing-list-g-1-1.jpg",
      "/images/gallery/listing-list-g-1-2.jpg",
      "/images/gallery/listing-list-g-1-3.jpg",
      "/images/gallery/listing-list-g-1-4.jpg",
      "/images/gallery/listing-list-g-1-5.jpg",
    ],
    images: [
      "/images/resources/jumeirah-beachsuggestion-1.png",
      "/images/resources/jumeirah-beachsuggestion-2.png",
    ],
    highlightList: [
      "Dubai Aquarium & Underwater Zoo",
      "VR Park & Indoor Theme Attractions",
      "Fashion & Luxury Shopping",
      "Souk & Specialty Zones",
      "KidZania",
      "Reel Cinemas",
      "Gourmet Dining & Cafes",
      "The Dubai Mall Waterfalls & Indoor Features",
    ],
    amenities: [
      "Cruise Dinner & Music Event",
      "Pick and Drop Services",
      "Additional Services",
      "Specialized bilingual guide",
      "Food and Drinks",
    ],
    amenitiesTwo: [
      "Cruise Dinner & Music Event",
      "Pick and Drop Services",
      "Additional Services",
      "Specialized bilingual guide",
      "Food and Drinks",
    ],
    comments: [
      {
        name: "Leslie Alexander",
        date: "February 10, 2024 at 2:37 pm",
        text: "Jumeirah Beach is beautiful and relaxing! The soft white sand and clear blue waters are perfect for sunbathing and swimming. The view of the Burj Al Arab in the background makes it even more special. A great spot to unwind and enjoy the sea in Dubai",
        avatar: "/images/blog/blog-comment-1-1.png",
        rating: 4,
      },
    ],
    relatedTours: [
      {
        id: 1,
        image: "/images/tourImages/burj-al-arab.png",
        title: "Burj Al Arab",
        link: "burj-al-arab",
        price: "Contact Us",
        rating: 5,
        reviews: 10,
        videoId: "0MuL8fd3pb8",
        discount: "",
        meta: [
          { id: 1, icon: "icon-pin1", title: "Dubai" },
          { id: 2, icon: "icon-calendar", title: "1 Day" },
        ],
      },
      {
        id: 2,
        image: "/images/tourImages/houses-the-dubai-aquarium.png",
        title: "houses the Dubai Aquarium",
        link: "dubai-aquarium-underwater-zoo",
        price: "Contact Us",
        rating: 4,
        reviews: 8,
        videoId: "GTn2EKD-cfg",
        discount: "40",
        meta: [
          { id: 1, icon: "icon-pin1", title: "Dubai" },
          { id: 2, icon: "icon-calendar", title: "1 Day" },
        ],
      },
    ],
    faqs: [
      {
        question: "Where is Jumeirah Beach located?",
        answer:
          "Jumeirah Beach is located along Dubai’s coast, near the iconic Burj Al Arab and Jumeirah district.",
      },
      {
        question: "What activities can I do at Jumeirah Beach?",
        answer:
          "Visitors can enjoy sunbathing, swimming, watersports like jet skiing and paddleboarding, beach volleyball, and photography.",
      },
      {
        question: "When is the best time to visit Jumeirah Beach?",
        answer:
          "The best time is from October to April when the weather is pleasant and ideal for beach activities.",
      },
    ],
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1805.1363830224027!2d55.22967693883007!3d25.194022294428265!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f42035d9872df%3A0x29698a78cf7295ef!2sJumeirah%20Beach!5e0!3m2!1sen!2sin!4v1760871145596!5m2!1sen!2sin",
  },
  {
    id: "desert-safari-dubai",
    title: "Desert Safari – Dubai’s Golden Dunes & Thrilling Adventures",
    reviews: 32,
    location: "Dubai",
    activitiesType: "Adventure",
    traveler: 1,
    activateDay: "Feb 5 - 5",
    price: "Contact Us ",
    overviewTitle: "Overview",
    titleTwo: "Highlight List",
    overview:
      "Experience the heart of Dubai’s desert with a thrilling Desert Safari, where golden dunes meet endless skies. Enjoy dune bashing in powerful 4x4s, camel rides across soft sands, and breathtaking sunset views that paint the horizon in shades of gold. As night falls, indulge in a traditional Bedouin-style camp with BBQ dinner, cultural performances, and star-lit serenity. Whether you crave adventure or a glimpse into Arabian heritage, the Desert Safari promises an unforgettable journey through Dubai’s timeless sands",
    topDestinations:
      "Experience the heart of Dubai’s desert with a thrilling Desert Safari, where golden dunes meet endless skies. Enjoy dune bashing in powerful 4x4s, camel rides across soft sands, and breathtaking sunset views that paint the horizon in shades of gold. As night falls, indulge in a traditional Bedouin-style camp with BBQ dinner, cultural performances, and star-lit serenity. Whether you crave adventure or a glimpse into Arabian heritage, the Desert Safari promises an unforgettable journey through Dubai’s timeless sands",
    sliderImages: [
      "/images/sliderImage/desert-safari-slider-1.png",
      "/images/sliderImage/desert-safari-slider-2.png",
      "/images/sliderImage/desert-safari-slider-3.png",
      "/images/sliderImage/desert-safari-slider-4.png",
    ],
    slider2Images: [
      "/images/gallery/listing-list-g-1-1.jpg",
      "/images/gallery/listing-list-g-1-2.jpg",
      "/images/gallery/listing-list-g-1-3.jpg",
      "/images/gallery/listing-list-g-1-4.jpg",
      "/images/gallery/listing-list-g-1-5.jpg",
    ],
    images: [
      "/images/resources/desert-safari-suggestion-1.png",
      "/images/resources/desert-safari-suggestion-2.png",
    ],
    highlightList: [
      "Dune Bashing in 4x4 Vehicles",
      "Camel Rides Across Golden Sands",
      "Stunning Desert Sunset Views",
      "Sandboarding Adventures",
      "Traditional Bedouin-Style Camps",
      "Cultural Performances & Belly Dancing",
      "BBQ Dinner Under the Stars",
      "Falconry Demonstrations & Desert Wildlife",
    ],
    amenities: [
      "Cruise Dinner & Music Event",
      "Pick and Drop Services",
      "Additional Services",
      "Specialized bilingual guide",
      "Food and Drinks",
    ],
    amenitiesTwo: [
      "Cruise Dinner & Music Event",
      "Pick and Drop Services",
      "Additional Services",
      "Specialized bilingual guide",
      "Food and Drinks",
    ],
    comments: [
      {
        name: "Leslie Alexander",
        date: "February 10, 2024 at 2:37 pm",
        text: "The Dubai Desert Safari was absolutely thrilling! Dune bashing in the 4x4 was so much fun, and the camel rides and sandboarding added to the adventure. The desert sunset was stunning, and the cultural performances with a BBQ dinner under the stars made it a perfect evening.",
        avatar: "/images/blog/blog-comment-1-1.png",
        rating: 4,
      },
    ],
    relatedTours: [
      {
        id: 1,
        image: "/images/tourImages/the-modern-dubai-frame.png",
        title: "The modern Dubai Frame",
        link: "modern-dubai-frame",
        price: "Contact Us",
        rating: 7,
        reviews: 10,
        videoId: "0MuL8fd3pb8",
        discount: "",
        meta: [
          { id: 1, icon: "icon-pin1", title: "Dubai" },
          { id: 2, icon: "icon-calendar", title: "1 Day" },
        ],
      },
      {
        id: 2,
        image: "/images/tourImages/dubai-mall.png",
        title: "The Dubai Mall",
        link: "dubai-mall",
        price: "Contact Us",
        rating: 9,
        reviews: 18,
        videoId: "GTn2EKD-cfg",
        discount: "40",
        meta: [
          { id: 1, icon: "icon-pin1", title: "Dubai" },
          { id: 2, icon: "icon-calendar", title: "1 Day" },
        ],
      },
    ],
    faqs: [
      {
        question: "Where does the Desert Safari take place?",
        answer:
          "The Desert Safari takes place in the outskirts of Dubai, across the vast golden dunes of the Arabian Desert.",
      },
      {
        question: "What activities are included in the Desert Safari?",
        answer:
          "Activities include dune bashing in 4x4 vehicles, camel rides, sandboarding, falconry displays, cultural performances, and a BBQ dinner under the stars.",
      },
      {
        question: "When is the best time to go on a Desert Safari?",
        answer:
          "The best time is from October to April when the weather is cooler and ideal for desert adventures and sunset views.",
      },
      {
        question: "Is the Desert Safari suitable for children and elderly?",
        answer:
          "Yes, most activities are family-friendly. However, dune bashing might be intense for very young children or elderly participants, so alternatives like camel rides and cultural camps are recommended.",
      },
      {
        question: "Do I need to bring anything for the Desert Safari?",
        answer:
          "It is recommended to wear comfortable clothing, carry sunscreen, sunglasses, a hat, and stay hydrated. Cameras are great for capturing the stunning desert views.",
      },
      {
        question: "Are food and drinks provided during the Desert Safari?",
        answer:
          "Yes, most Desert Safari packages include a BBQ dinner with vegetarian and non-vegetarian options, soft drinks, and traditional refreshments at the desert camp.",
      },
      {
        question: "How long does the Desert Safari last?",
        answer:
          "A typical Desert Safari lasts around 6–7 hours, starting in the late afternoon and ending at night after dinner and entertainment at the desert camp.",
      },
    ],

    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d115540.97402683046!2d55.185243723626975!3d25.181109734767507!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f5cb5f605c7db%3A0xe5f73c2398a9a497!2sDesert%20Safaris%20Dubai!5e0!3m2!1sen!2sin!4v1760875101447!5m2!1sen!2sin",
  },
  {
    id: "modern-dubai-frame",
    title: "The Modern Frame – Dubai’s Iconic Landmark & City Viewpoint",
    reviews: 42,
    location: "Dubai",
    activitiesType: "Adventure",
    traveler: 1,
    activateDay: "Feb 5 - 5",
    price: "Contact Us ",
    overviewTitle: "Overview",
    titleTwo: "Highlight List",
    overview:
      "Step into the heart of modern Dubai with a visit to the iconic Dubai Frame, a stunning architectural marvel that perfectly captures the city’s past, present, and future. Soaring 150 meters high, it offers breathtaking panoramic views of both Old Dubai and the glittering skyline of New Dubai. Explore interactive exhibits that showcase the city’s transformation from a humble fishing village to a global metropolis. Whether you’re admiring the skyline from the glass bridge or capturing Instagram-worthy moments, the Dubai Frame promises a truly unforgettable experience that symbolizes Dubai’s spirit of innovation and progress.",
    topDestinations:
      "Step into the heart of modern Dubai with a visit to the iconic Dubai Frame, a stunning architectural marvel that perfectly captures the city’s past, present, and future. Soaring 150 meters high, it offers breathtaking panoramic views of both Old Dubai and the glittering skyline of New Dubai. Explore interactive exhibits that showcase the city’s transformation from a humble fishing village to a global metropolis. Whether you’re admiring the skyline from the glass bridge or capturing Instagram-worthy moments, the Dubai Frame promises a truly unforgettable experience that symbolizes Dubai’s spirit of innovation and progress.",
    sliderImages: [
      "/images/sliderImage/dubai-frame-slider-1.png",
      "/images/sliderImage/dubai-frame-slider-2.png",
      "/images/sliderImage/dubai-frame-slider-3.png",
    ],
    slider2Images: [
      "/images/gallery/listing-list-g-1-1.jpg",
      "/images/gallery/listing-list-g-1-2.jpg",
      "/images/gallery/listing-list-g-1-3.jpg",
      "/images/gallery/listing-list-g-1-4.jpg",
      "/images/gallery/listing-list-g-1-5.jpg",
    ],
    images: [
      "/images/resources/dubai-frame-suggestion-1.png",
      "/images/resources/dubai-frame-suggestion-2.png",
    ],
    highlightList: [
      "Panoramic Views of Old and New Dubai",
      "150-Meter High Glass Sky Bridge Walk",
      "Immersive Museum Showcasing Dubai’s Past, Present & Future",
      "Stunning Architectural Landmark Framing the City Skyline",
      "Interactive Exhibits and LED Displays",
      "Observation Deck with 360° City Views",
      "Photography Spots with Iconic Backdrops",
      "Located in the Heart of Zabeel Park",
    ],

    amenities: [
      "Cruise Dinner & Music Event",
      "Pick and Drop Services",
      "Additional Services",
      "Specialized bilingual guide",
      "Food and Drinks",
    ],
    amenitiesTwo: [
      "Cruise Dinner & Music Event",
      "Pick and Drop Services",
      "Additional Services",
      "Specialized bilingual guide",
      "Food and Drinks",
    ],
    comments: [
      {
        name: "Leslie Alexander",
        date: "February 10, 2024 at 2:37 pm",
        text: "Visiting the Dubai Frame was an incredible experience! The views from the Sky Deck are breathtaking, showing both Old and New Dubai. Walking on the glass bridge was thrilling, and the exhibits inside beautifully showcase the city’s history and growth. Highly recommend it!",
        avatar: "/images/blog/blog-comment-1-1.png",
        rating: 4,
      },
    ],
    relatedTours: [
      {
        id: 1,
        image: "/images/tourImages/desert-safari-dubai.png",
        title: "Desert Safari Dubai",
        link: "desert-safari-dubai",
        price: "Contact Us",
        rating: 7,
        reviews: 10,
        videoId: "0MuL8fd3pb8",
        discount: "",
        meta: [
          { id: 1, icon: "icon-pin1", title: "Dubai" },
          { id: 2, icon: "icon-calendar", title: "1 Day" },
        ],
      },
      {
        id: 2,
        image: "/images/tourImages/houses-the-dubai-aquarium.png",
        title: "houses the Dubai Aquarium",
        link: "dubai-aquarium-underwater-zoo",
        price: "Contact Us",
        rating: 9,
        reviews: 18,
        videoId: "GTn2EKD-cfg",
        discount: "40",
        meta: [
          { id: 1, icon: "icon-pin1", title: "Dubai" },
          { id: 2, icon: "icon-calendar", title: "1 Day" },
        ],
      },
    ],
    faqs: [
      {
        question: "What is the Dubai Frame?",
        answer:
          "The Dubai Frame is a modern architectural landmark that offers panoramic views of both old and new Dubai, symbolizing the city’s transformation from a fishing village to a global metropolis.",
      },
      {
        question: "Where is the Dubai Frame located?",
        answer:
          "The Dubai Frame is located in Zabeel Park, one of Dubai’s largest and most beautiful green spaces, easily accessible from major city areas.",
      },
      {
        question: "What can visitors see from the top of the Dubai Frame?",
        answer:
          "From the Sky Deck at 150 meters high, visitors can view modern Dubai’s skyline on one side and the historic parts of the city on the other, connected by a glass-floored bridge.",
      },
      {
        question: "What are the visiting hours of the Dubai Frame?",
        answer:
          "The Dubai Frame is open daily from 9:00 AM to 9:00 PM, but timings may vary during public holidays or special events.",
      },
      {
        question: "Is there an entry fee for the Dubai Frame?",
        answer:
          "Yes, there is an entry fee. As of now, general admission tickets cost around AED 50 for adults and AED 20 for children, while entry is free for kids under 3 and people of determination.",
      },
    ],

    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3609.043726004866!2d55.29776597597551!3d25.23545217768636!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f42db20d99d41%3A0xf93035af01a85798!2sDubai%20Frame!5e0!3m2!1sen!2sin!4v1760882114763!5m2!1sen!2sin",
  },
  {
    id: "burj-al-arab",
    title:
      "Burj Al Arab – Dubai’s Iconic Sail-Shaped Wonder & Luxury Experience",
    reviews: 42,
    location: "Dubai",
    activitiesType: "Adventure",
    traveler: 1,
    activateDay: "Feb 5 - 5",
    price: "Contact Us ",
    overviewTitle: "Overview",
    titleTwo: "Highlight List",
    overview:
      "Experience the epitome of luxury and architectural brilliance with a visit to the Burj Al Arab, Dubai’s world-famous sail-shaped hotel. Rising gracefully from its own private island, this iconic landmark redefines opulence and innovation. Step inside to witness stunning interiors adorned with gold accents, grand atriums, and breathtaking sea views that showcase the finest in modern design. Whether you’re dining at one of its award-winning restaurants, relaxing at the exclusive terrace, or simply admiring its majestic presence from Jumeirah Beach, the Burj Al Arab offers an unforgettable glimpse into Dubai’s unmatched hospitality and elegance.",
    topDestinations:
      "Experience the epitome of luxury and architectural brilliance with a visit to the Burj Al Arab, Dubai’s world-famous sail-shaped hotel. Rising gracefully from its own private island, this iconic landmark redefines opulence and innovation. Step inside to witness stunning interiors adorned with gold accents, grand atriums, and breathtaking sea views that showcase the finest in modern design. Whether you’re dining at one of its award-winning restaurants, relaxing at the exclusive terrace, or simply admiring its majestic presence from Jumeirah Beach, the Burj Al Arab offers an unforgettable glimpse into Dubai’s unmatched hospitality and elegance.",
    sliderImages: [
      "/images/sliderImage/burj-al-arab-slider-1.png",
      "/images/sliderImage/burj-al-arab-slider-2.png",
      "/images/sliderImage/burj-al-arab-slider-3.png",
      "/images/sliderImage/burj-al-arab-slider-4.png",
    ],
    slider2Images: [
      "/images/gallery/listing-list-g-1-1.jpg",
      "/images/gallery/listing-list-g-1-2.jpg",
      "/images/gallery/listing-list-g-1-3.jpg",
      "/images/gallery/listing-list-g-1-4.jpg",
      "/images/gallery/listing-list-g-1-5.jpg",
    ],
    images: [
      "/images/resources/burj-al-arab-suggestion-1.png",
      "/images/resources/burj-al-arab-suggestion-2.png",
    ],
    highlightList: [
      "Iconic Sail-Shaped Architectural Design",
      "World’s Most Luxurious 7-Star Hotel Experience",
      "Exclusive Access to Private Island Location",
      "Panoramic Views of the Arabian Gulf and Dubai Skyline",
      "Lavish Interiors Adorned with Gold and Marble",
      "Award-Winning Fine Dining Restaurants",
      "Helipad Offering Stunning Aerial Views",
      "Private Beach and Terrace with Infinity Pools",
    ],

    amenities: [
      "Cruise Dinner & Music Event",
      "Pick and Drop Services",
      "Additional Services",
      "Specialized bilingual guide",
      "Food and Drinks",
    ],
    amenitiesTwo: [
      "Cruise Dinner & Music Event",
      "Pick and Drop Services",
      "Additional Services",
      "Specialized bilingual guide",
      "Food and Drinks",
    ],
    comments: [
      {
        name: "Leslie Alexander",
        date: "February 10, 2024 at 2:37 pm",
        text: "Absolutely stunning! The white sands and clear waters make it the perfect spot to relax and take in the view of the Burj Al Arab.",
        avatar: "/images/blog/blog-comment-1-1.png",
        rating: 4,
      },
    ],
    relatedTours: [
      {
        id: 1,
        image: "/images/tourImages/desert-safari-dubai.png",
        title: "The Burj Khalifa",
        link: "burj-khalifa",
        price: "Contact Us",
        rating: 9,
        reviews: 30,
        videoId: "0MuL8fd3pb8",
        discount: "",
        meta: [
          { id: 1, icon: "icon-pin1", title: "Dubai" },
          { id: 2, icon: "icon-calendar", title: "1 Day" },
        ],
      },
      {
        id: 2,
        image: "/images/tourImages/houses-the-dubai-aquarium.png",
        title: "Jumeirah Beach",
        link: "jumeirah-beach",
        price: "Contact Us",
        rating: 9,
        reviews: 18,
        videoId: "GTn2EKD-cfg",
        discount: "40",
        meta: [
          { id: 1, icon: "icon-pin1", title: "Dubai" },
          { id: 2, icon: "icon-calendar", title: "1 Day" },
        ],
      },
    ],
    faqs: [
      {
        question: "What is the Burj Al Arab?",
        answer:
          "The Burj Al Arab is one of Dubai’s most iconic landmarks, known as the world’s only 7-star hotel. Shaped like a sail, it represents luxury, innovation, and architectural excellence on Dubai’s coastline.",
      },
      {
        question: "Where is the Burj Al Arab located?",
        answer:
          "The Burj Al Arab is located on its own private island off Jumeirah Beach, connected to the mainland by a private bridge in the Jumeirah area of Dubai.",
      },
      {
        question: "Can visitors enter the Burj Al Arab without staying there?",
        answer:
          "Yes, visitors can experience the Burj Al Arab through guided tours, afternoon tea, or dining reservations at its world-renowned restaurants without being hotel guests.",
      },
      {
        question: "What are the visiting hours of the Burj Al Arab?",
        answer:
          "Visiting hours vary depending on reservations and experiences, but tours and dining options are typically available from 10:00 AM to 8:00 PM daily.",
      },
      {
        question: "What makes the Burj Al Arab special?",
        answer:
          "The Burj Al Arab is famous for its sail-shaped design, luxurious interiors decorated with gold leaf, personalized butler service, and breathtaking views of the Arabian Gulf and Dubai skyline.",
      },
    ],

    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3611.28741746799!2d55.20057578560149!3d25.159771220326586!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6be81e5c4d0f%3A0x7ef4344209b0b62!2sBURJ%20AL%20ARAB%20BEACH!5e0!3m2!1sen!2sin!4v1760882169361!5m2!1sen!2sin",
  },
  {
    id: "dubai-aquarium-underwater-zoo",
    title:
      "Dubai Aquarium & Underwater Zoo – A Captivating Marine World in the Heart of the City",
    reviews: 10,
    location: "Dubai",
    activitiesType: "Adventure",
    traveler: 1,
    activateDay: "Feb 5 - 5",
    price: "Contact Us ",
    overviewTitle: "Overview",
    titleTwo: "Highlight List",
    overview:
      "Dive into a world of wonder at the Dubai Aquarium & Underwater Zoo, one of the largest suspended aquariums in the world, located inside The Dubai Mall. Home to thousands of aquatic animals, including sharks, rays, and exotic fish, it offers an incredible glimpse into the beauty of marine life. Walk through the 48-meter-long underwater tunnel and feel surrounded by the ocean as sea creatures glide above and around you. Explore the Underwater Zoo on the upper level to meet penguins, crocodiles, and other fascinating species. Whether you’re visiting with family or friends, the Dubai Aquarium & Underwater Zoo promises an awe-inspiring journey through the depths of the sea right in the heart of the city.",
    topDestinations:
      "Dive into a world of wonder at the Dubai Aquarium & Underwater Zoo, one of the largest suspended aquariums in the world, located inside The Dubai Mall. Home to thousands of aquatic animals, including sharks, rays, and exotic fish, it offers an incredible glimpse into the beauty of marine life. Walk through the 48-meter-long underwater tunnel and feel surrounded by the ocean as sea creatures glide above and around you. Explore the Underwater Zoo on the upper level to meet penguins, crocodiles, and other fascinating species. Whether you’re visiting with family or friends, the Dubai Aquarium & Underwater Zoo promises an awe-inspiring journey through the depths of the sea right in the heart of the city.",
    sliderImages: [
      "/images/sliderImage/dubai-aquarium-slider-1.png",
      "/images/sliderImage/dubai-aquarium-slider-2.png",
      "/images/sliderImage/dubai-aquarium-slider-3.png",
    ],
    slider2Images: [
      "/images/gallery/listing-list-g-1-1.jpg",
      "/images/gallery/listing-list-g-1-2.jpg",
      "/images/gallery/listing-list-g-1-3.jpg",
      "/images/gallery/listing-list-g-1-4.jpg",
      "/images/gallery/listing-list-g-1-5.jpg",
    ],
    images: [
      "/images/resources/dubai-aquarium-suggestion-1.png",
      "/images/resources/dubai-aquarium-suggestion-2.png",
    ],
    highlightList: [
      "World’s Largest Suspended Aquarium",
      "48-Meter Underwater Tunnel",
      "Sharks, Rays & Exotic Marine Life",
      "Underwater Zoo with Penguins & Crocodiles",
      "Interactive Touch Pools",
      "Glass Walkways with Ocean Views",
      "Family-Friendly Experience",
      "Located in The Dubai Mall",
    ],

    amenities: [
      "Cruise Dinner & Music Event",
      "Pick and Drop Services",
      "Additional Services",
      "Specialized bilingual guide",
      "Food and Drinks",
    ],
    amenitiesTwo: [
      "Cruise Dinner & Music Event",
      "Pick and Drop Services",
      "Additional Services",
      "Specialized bilingual guide",
      "Food and Drinks",
    ],
    comments: [
      {
        name: "Leslie Alexander",
        date: "February 10, 2024 at 2:37 pm",
        text: "Absolutely loved visiting the Dubai Aquarium! The underwater tunnel was amazing, and seeing the sharks and rays up close was unforgettable. The Underwater Zoo on the upper level is fun for kids and adults alike. A must-visit for anyone in Dubai!",
        avatar: "/images/blog/blog-comment-1-1.png",
        rating: 4,
      },
    ],
    relatedTours: [
      {
        id: 1,
        image: "/images/tourImages/desert-safari-dubai.png",
        title: "Desert Safari Dubai",
        link: "desert-safari-dubai",
        price: "Contact Us",
        rating: 7,
        reviews: 10,
        videoId: "0MuL8fd3pb8",
        discount: "",
        meta: [
          { id: 1, icon: "icon-pin1", title: "Dubai" },
          { id: 2, icon: "icon-calendar", title: "1 Day" },
        ],
      },
      {
        id: 2,
        image: "/images/tourImages/dubai-mall.png",
        title: "The Dubai Mall",
        link: "dubai-mall",
        price: "Contact Us",
        rating: 9,
        reviews: 18,
        videoId: "GTn2EKD-cfg",
        discount: "40",
        meta: [
          { id: 1, icon: "icon-pin1", title: "Dubai" },
          { id: 2, icon: "icon-calendar", title: "1 Day" },
        ],
      },
    ],
    faqs: [
      {
        question: "What is the Dubai Aquarium & Underwater Zoo?",
        answer:
          "The Dubai Aquarium & Underwater Zoo is one of the world’s largest suspended aquariums, home to thousands of marine animals including sharks, rays, and exotic fish, along with an upper-level zoo featuring penguins, crocodiles, and other fascinating species.",
      },
      {
        question: "Where is the Dubai Aquarium & Underwater Zoo located?",
        answer:
          "It is located inside The Dubai Mall, in the heart of Downtown Dubai, making it easily accessible for visitors exploring the city’s central attractions.",
      },
      {
        question:
          "What can visitors see and do at the Dubai Aquarium & Underwater Zoo?",
        answer:
          "Visitors can walk through the 48-meter-long underwater tunnel, explore the Underwater Zoo, interact with touch pools, see educational exhibits, and capture amazing photos of marine life.",
      },
      {
        question:
          "What are the visiting hours of the Dubai Aquarium & Underwater Zoo?",
        answer:
          "The aquarium and zoo are typically open daily from 10:00 AM to 10:00 PM, though timings may vary during holidays or special events.",
      },
      {
        question:
          "Is there an entry fee for the Dubai Aquarium & Underwater Zoo?",
        answer:
          "Yes, there is an entry fee. General admission tickets include access to the aquarium and the Underwater Zoo, while special experiences like cage snorkeling or shark diving are available at additional cost.",
      },
    ],

    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3610.169273979546!2d55.27592557597451!3d25.197513377710727!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f43496ad9c645%3A0x230b55e177a8dd29!2sDubai%20Aquarium%20%26%20Underwater%20Zoo!5e0!3m2!1sen!2sin!4v1760882200160!5m2!1sen!2sin",
  },
];

export default tourDetailsOneData;
