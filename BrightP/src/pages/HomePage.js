import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./HomePage.css";

const BTN_BASE =
  "inline-flex items-center justify-center gap-[8px] rounded-[8px] font-[550] no-underline cursor-pointer transition-all duration-[250ms] relative overflow-hidden";
const BTN_OUTLINE_SM = `${BTN_BASE} px-[16px] py-[8px] text-[11px] bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-white hover:-translate-y-px hover:shadow-[var(--shadow-md)]`;
const BTN_PRIMARY_SM = `${BTN_BASE} px-[16px] py-[8px] text-[11px] bg-gradient-to-br from-primary to-primary-active text-white shadow-[var(--shadow-md)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-lg)]`;
const BTN_PRIMARY_LG = `${BTN_BASE} px-[32px] py-[16px] text-[14px] bg-gradient-to-br from-primary to-primary-active text-white shadow-[var(--shadow-md)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-lg)]`;
const BTN_OUTLINE_WHITE_LG = `${BTN_BASE} px-[32px] py-[16px] text-[14px] bg-transparent text-primary shadow-[var(--shadow-md)] border border-[rgba(255,0,0,0.8)] rounded-[12px] hover:bg-gradient-to-br hover:from-primary hover:to-primary-active hover:text-white hover:-translate-y-px`;

const navLinkCls = (isActive) =>
  `text-[12px] font-medium py-[8px] relative no-underline transition-all duration-[150ms] after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-0 after:bg-[var(--color-warning)] after:transition-all after:duration-[150ms] ${
    isActive
      ? "text-primary after:w-full"
      : "text-[var(--color-text-secondary)] hover:text-primary after:w-0 hover:after:w-full"
  }`;

const SERVICE_ICON_SIZE =
  "w-[80px] h-[80px] max-[480px]:w-[60px] max-[480px]:h-[60px] rounded-[12px] flex items-center justify-center mx-auto mb-[24px] text-white text-[24px] max-[480px]:text-[18px] shadow-[var(--shadow-lg)] transition-all duration-[250ms] group-hover:scale-110";

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("");
  const [toggle, setToggle] = useState(false);

  useEffect(() => {
    const curr = location.hash;
    setActiveTab(curr);
  }, [location.hash]);

  const destinations = [
    {
      id: 1,
      name: "Paris, France",
      price: "From ₹899",
      image:
        "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=600&h=400&fit=crop",
      description:
        "The City of Light awaits with its iconic landmarks and romantic charm",
      rating: 4.8,
    },
    {
      id: 2,
      name: "Tokyo, Japan",
      price: "From ₹1299",
      image:
        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop",
      description: "Where ancient traditions meet cutting-edge innovation",
      rating: 4.9,
    },
    {
      id: 3,
      name: "Bali, Indonesia",
      price: "From ₹799",
      image:
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop",
      description: "Tropical paradise with stunning beaches and rich culture",
      rating: 4.7,
    },
    {
      id: 4,
      name: "Dubai, UAE",
      price: "From ₹1099",
      image:
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop",
      description: "Luxury and adventure in the heart of the desert",
      rating: 4.6,
    },
    {
      id: 5,
      name: "London, UK",
      price: "From ₹999",
      image:
        "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop",
      description: "Historic charm meets modern sophistication",
      rating: 4.5,
    },
    {
      id: 6,
      name: "New York, USA",
      price: "From ₹1199",
      image:
        "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=400&fit=crop",
      description: "The city that never sleeps, full of endless possibilities",
      rating: 4.8,
    },
  ];

  const services = [
    {
      icon: "fas fa-plane",
      title: "Flight Bookings",
      description:
        "Discover the best flight deals worldwide with our exclusive partnerships and real-time pricing",
      features: ["Best Price Guarantee", "Flexible Dates", "24/7 Support"],
      color: "#3b82f6",
    },
    {
      icon: "fas fa-hotel",
      title: "Hotel Reservations",
      description:
        "From luxury resorts to cozy boutique hotels, find the perfect accommodation for your stay",
      features: [
        "Premium Properties",
        "Instant Confirmation",
        "Free Cancellation",
      ],
      color: "#10b981",
    },
    {
      icon: "fas fa-map-marked-alt",
      title: "Tour Packages",
      description:
        "Carefully curated travel experiences with expert local guides and authentic cultural immersion",
      features: [
        "Expert Guides",
        "Cultural Immersion",
        "All-Inclusive Options",
      ],
      color: "#f59e0b",
    },
    {
      icon: "fas fa-passport",
      title: "Visa Services",
      description:
        "Hassle-free visa processing with dedicated support to ensure smooth travel documentation",
      features: ["Fast Processing", "Document Support", "Status Tracking"],
      color: "#8b5cf6",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      location: "New York, USA",
      rating: 5,
      text: "Bright Wings made our European vacation absolutely perfect. The attention to detail and customer service was exceptional.",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      trip: "European Grand Tour",
    },
    {
      name: "Michael Chen",
      location: "Singapore",
      rating: 5,
      text: "The visa processing was incredibly smooth and fast. I got my documents approved much quicker than expected.",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      trip: "Business Travel to Europe",
    },
    {
      name: "Emily Davis",
      location: "London, UK",
      rating: 5,
      text: "Amazing tour packages with authentic local experiences. Every moment was carefully planned and executed beautifully.",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      trip: "Asian Cultural Discovery",
    },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-[rgba(252,252,249,0.95)] backdrop-blur-[20px] border-b border-[var(--color-border)] z-[1000] transition-all duration-[250ms]">
        <div className="relative max-w-[1280px] mx-auto px-[16px] max-[480px]:px-[12px] flex items-center justify-between h-[80px] max-[480px]:h-[65px]">
          <div className="flex items-center gap-[12px] cursor-pointer transition-all duration-[150ms] hover:-translate-y-px">
            <div
              className="w-[48px] h-[48px] max-[480px]:w-[40px] max-[480px]:h-[40px] bg-gradient-to-br from-primary to-primary-active rounded-[12px] flex items-center justify-center text-white text-[18px] shadow-[var(--shadow-md)]"
            >
              <i className="fas fa-paper-plane"></i>
            </div>
            <div
              className="max-[480px]:hidden min-[481px]:flex flex-col"
              onClick={() => {
                navigate("/#home");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <span className="text-[18px] font-[600] text-primary leading-none">Bright Wings</span>
              <span className="text-[11px] text-[var(--color-text-secondary)] font-medium leading-none">Travel & Tourism</span>
            </div>
          </div>
          <div className="max-[768px]:hidden min-[769px]:flex items-center gap-[32px]">
            <a href="#home" className={navLinkCls(activeTab === "#home")}>
              Home
            </a>
            <a href="#destinations" className={navLinkCls(activeTab === "#destinations")}>
              Destinations
            </a>
            <a href="#services" className={navLinkCls(activeTab === "#services")}>
              Services
            </a>
            <a href="#testimonials" className={navLinkCls(activeTab === "#reviews")}>
              Reviews
            </a>
            <a href="#contact" className={navLinkCls(activeTab === "#contact")}>
              Contact
            </a>
          </div>
          <div className="flex items-center gap-5">
            <button
              className={BTN_OUTLINE_SM}
              onClick={() => navigate("/auth")}
            >
              Sign In
            </button>
            <div
              onClick={() => setToggle((prev) => !prev)}
              className="z-50 relative md:hidden text-3xl cursor-pointer"
            >
              {toggle ? <i className="fas fa-close"></i> : <i className="fas fa-bars"></i>}
            </div>
          </div>
        </div>
        <div
          className={`fixed z-40 w-full h-screen duration-300 overflow-hidden bg-white top-0 right-0  ${
            toggle ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col gap-3 mt-12 p-5 bg-white">
            <a
              href="#home"
              className={navLinkCls(activeTab === "#home")}
              onClick={() => setToggle(false)}
            >
              Home
            </a>
            <a
              href="#destinations"
              className={navLinkCls(activeTab === "#destinations")}
              onClick={() => setToggle(false)}
            >
              Destinations
            </a>
            <a
              href="#services"
              className={navLinkCls(activeTab === "#services")}
              onClick={() => setToggle(false)}
            >
              Services
            </a>
            <a
              href="#testimonials"
              className={navLinkCls(activeTab === "#reviews")}
              onClick={() => setToggle(false)}
            >
              Reviews
            </a>
            <a
              href="#contact"
              className={navLinkCls(activeTab === "#contact")}
              onClick={() => setToggle(false)}
            >
              Contact
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="relative min-h-screen flex flex-col items-center justify-center text-center text-white overflow-hidden gap-[56px] max-[1024px]:p-[48px] max-[480px]:p-[16px] max-[480px]:mt-[32px]"
      >
        <div className="absolute top-0 left-0 w-full h-full -z-20 bg-gradient-to-br from-primary via-primary-active to-[var(--color-warning)] before:content-[''] before:absolute before:inset-0 before:bg-[url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&h=900&fit=crop')] before:bg-cover before:bg-center before:opacity-[0.15]"></div>
        <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[rgba(33,128,141,0.4)]"></div>
        <div className="absolute top-0 left-0 w-full h-full [animation:float_20s_ease-in-out_infinite] [background-image:radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:50px_50px]"></div>
        <div className="relative z-[2] max-w-[900px] px-[16px] max-[480px]:px-[12px] mt-[80px]">
          <h1 className="text-[70px] max-[768px]:text-[4.5rem] max-[480px]:text-[2rem] font-[600] leading-tight mb-[24px] max-[480px]:mb-[16px] [text-shadow:0_2px_4px_rgba(0,0,0,0.1)]">
            Explore the World with
            <span className="bg-gradient-to-br from-[var(--color-warning)] to-[var(--color-orange-400)] bg-clip-text text-transparent"> Bright Wings</span>
          </h1>
          <p className="text-[18px] max-[480px]:text-[12px] mb-[32px] max-[480px]:mb-[20px] opacity-95 leading-normal max-w-[700px] mx-auto text-[var(--color-charcoal-700)]">
            Your trusted partner for unforgettable travel experiences.
            Discover amazing destinations, book with confidence, and create
            memories that last a lifetime with our premium travel services.
          </p>
          <div className="flex justify-center gap-[32px] max-[768px]:gap-[16px] max-[480px]:gap-[12px] mb-[40px] flex-wrap">
            <div className="flex items-center gap-[8px] font-medium text-[12px] text-[rgb(48,48,48)]">
              <i className="fas fa-shield-alt text-[16px] text-[var(--color-warning)]"></i>
              <span>Secure Booking</span>
            </div>
            <div className="flex items-center gap-[8px] font-medium text-[12px] text-[rgb(48,48,48)]">
              <i className="fas fa-star text-[16px] text-[var(--color-warning)]"></i>
              <span>Best Prices</span>
            </div>
            <div className="flex items-center gap-[8px] font-medium text-[12px] text-[rgb(48,48,48)]">
              <i className="fas fa-headset text-[16px] text-[var(--color-warning)]"></i>
              <span>24/7 Support</span>
            </div>
          </div>
          <div className="flex justify-center gap-[16px] max-[480px]:flex-col max-[480px]:gap-[12px] flex-wrap max-[480px]:flex-nowrap">
            <button
              className={BTN_PRIMARY_LG}
              onClick={() => navigate("/auth")}
            >
              <i className="fas fa-plane"></i>
              Start Your Journey
            </button>
            <button className={BTN_OUTLINE_WHITE_LG}>
              <i className="fas fa-play"></i>
              Watch Video
            </button>
          </div>
        </div>

        {/* Floating Stats */}
        <div className="w-full grid grid-cols-2 gap-3 sm:gap-10 max-w-[60rem] mx-auto">
          <div className="text-center w-full bg-white/15 p-[24px] max-[768px]:p-[16px] max-[480px]:p-[12px] rounded-[12px] backdrop-blur-[20px] border border-white/20 min-w-[140px] max-[768px]:min-w-[120px] max-[480px]:min-w-[100px] transition-all duration-[250ms] hover:-translate-y-[4px] hover:bg-white/20">
            <div className="text-[24px] max-[480px]:text-[18px] font-[600] text-[var(--color-warning)] mb-[8px] max-[480px]:mb-[4px] [text-shadow:0_2px_4px_rgba(0,0,0,0.1)]">50K+</div>
            <div className="text-[12px] font-medium opacity-90">Happy Travelers</div>
          </div>
          <div className="text-center w-full bg-white/15 p-[24px] max-[768px]:p-[16px] max-[480px]:p-[12px] rounded-[12px] backdrop-blur-[20px] border border-white/20 min-w-[140px] max-[768px]:min-w-[120px] max-[480px]:min-w-[100px] transition-all duration-[250ms] hover:-translate-y-[4px] hover:bg-white/20">
            <div className="text-[24px] max-[480px]:text-[18px] font-[600] text-[var(--color-warning)] mb-[8px] max-[480px]:mb-[4px] [text-shadow:0_2px_4px_rgba(0,0,0,0.1)]">200+</div>
            <div className="text-[12px] font-medium opacity-90">Destinations</div>
          </div>
          <div className="text-center w-full bg-white/15 p-[24px] max-[768px]:p-[16px] max-[480px]:p-[12px] rounded-[12px] backdrop-blur-[20px] border border-white/20 min-w-[140px] max-[768px]:min-w-[120px] max-[480px]:min-w-[100px] transition-all duration-[250ms] hover:-translate-y-[4px] hover:bg-white/20">
            <div className="text-[24px] max-[480px]:text-[18px] font-[600] text-[var(--color-warning)] mb-[8px] max-[480px]:mb-[4px] [text-shadow:0_2px_4px_rgba(0,0,0,0.1)]">24/7</div>
            <div className="text-[12px] font-medium opacity-90">Customer Support</div>
          </div>
          <div className="text-center w-full bg-white/15 p-[24px] max-[768px]:p-[16px] max-[480px]:p-[12px] rounded-[12px] backdrop-blur-[20px] border border-white/20 min-w-[140px] max-[768px]:min-w-[120px] max-[480px]:min-w-[100px] transition-all duration-[250ms] hover:-translate-y-[4px] hover:bg-white/20">
            <div className="text-[24px] max-[480px]:text-[18px] font-[600] text-[var(--color-warning)] mb-[8px] max-[480px]:mb-[4px] [text-shadow:0_2px_4px_rgba(0,0,0,0.1)]">99%</div>
            <div className="text-[12px] font-medium opacity-90">Satisfaction Rate</div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-[24px] bg-[var(--color-background)] relative">
        <div className="max-w-[1280px] mx-auto px-[16px] max-[480px]:px-[12px]">
          <div className="text-center mb-[16px] max-[480px]:mb-[48px] max-w-[800px] mx-auto">
            <span className="relative inline-block text-[var(--color-warning)] text-[12px] font-[550] uppercase tracking-[0.1em] mb-[16px] after:content-[''] after:absolute after:-bottom-[8px] after:left-1/2 after:-translate-x-1/2 after:w-[40px] after:h-[2px] after:bg-[var(--color-warning)]">Our Services</span>
            <h2 className="text-[clamp(2rem,4vw,3rem)] max-[768px]:text-[2rem] max-[480px]:text-[20px] font-[600] text-primary leading-tight mb-[24px] max-[480px]:mb-[16px]">
              Everything You Need for Your Perfect Trip
            </h2>
            <p className="text-[16px] max-[480px]:text-[14px] text-[var(--color-text-secondary)] leading-normal">
              From flights to accommodations, tours to visa services - we've got
              you covered with comprehensive travel solutions.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {services.map((service, index) => (
              <div
                key={index}
                className="group bg-[var(--color-surface)] rounded-[12px] p-[32px] max-[480px]:p-[24px] text-center shadow-[var(--shadow-md)] border border-[var(--color-card-border)] transition-all duration-[250ms] cursor-pointer relative overflow-hidden hover:-translate-y-[8px] hover:shadow-[var(--shadow-lg)] before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-[4px] before:bg-gradient-to-r before:from-primary before:to-[var(--color-warning)] before:scale-x-0 before:transition-all before:duration-[250ms] hover:before:scale-x-100"
                onClick={() => navigate("/auth")}
              >
                <div
                  className={SERVICE_ICON_SIZE}
                  style={{ backgroundColor: service.color }}
                >
                  <i className={service.icon}></i>
                </div>
                <div className="mb-[24px]">
                  <h3 className="text-[18px] font-[600] text-[var(--color-text)] mb-[16px]">{service.title}</h3>
                  <p className="text-[var(--color-text-secondary)] leading-normal mb-[20px]">{service.description}</p>
                  <ul className="list-none text-left">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-[8px] mb-[8px] text-[12px] text-[var(--color-text-secondary)]">
                        <i className="fas fa-check text-[var(--color-success)] text-[12px]"></i>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto">
                  <button className={BTN_OUTLINE_SM}>
                    Explore More
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations Section */}
      <section id="destinations" className="py-[24px] bg-[var(--color-surface)]">
        <div className="max-w-[1280px] mx-auto px-[16px] max-[480px]:px-[12px]">
          <div className="text-center mb-[16px] max-[480px]:mb-[48px] max-w-[800px] mx-auto">
            <span className="relative inline-block text-[var(--color-warning)] text-[12px] font-[550] uppercase tracking-[0.1em] mb-[16px] after:content-[''] after:absolute after:-bottom-[8px] after:left-1/2 after:-translate-x-1/2 after:w-[40px] after:h-[2px] after:bg-[var(--color-warning)]">Popular Destinations</span>
            <h2 className="text-[clamp(2rem,4vw,3rem)] max-[768px]:text-[2rem] max-[480px]:text-[20px] font-[600] text-primary leading-tight mb-[24px] max-[480px]:mb-[16px]">
              Discover Amazing Places Around the World
            </h2>
            <p className="text-[16px] max-[480px]:text-[14px] text-[var(--color-text-secondary)] leading-normal">
              From bustling cities to serene beaches, explore our handpicked
              destinations that offer unforgettable experiences.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {destinations.map((destination) => (
              <div
                key={destination.id}
                className="group bg-[var(--color-surface)] rounded-[12px] overflow-hidden shadow-[var(--shadow-md)] border border-[var(--color-card-border)] transition-all duration-[250ms] cursor-pointer hover:-translate-y-[4px] hover:shadow-[var(--shadow-lg)]"
                onClick={() => navigate("/auth")}
              >
                <div className="relative h-[250px] overflow-hidden">
                  <img src={destination.image} alt={destination.name} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/30 flex justify-between items-start p-[16px] opacity-0 transition-all duration-[250ms] group-hover:opacity-100">
                    <div className="flex items-center gap-[4px] bg-white/90 px-[12px] py-[4px] rounded-full text-[var(--color-text)] font-[550] text-[12px]">
                      <i className="fas fa-star text-[var(--color-warning)]"></i>
                      {destination.rating}
                    </div>
                    <div>
                      <button className={BTN_PRIMARY_SM}>
                        <i className="fas fa-heart"></i>
                        Save
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-[24px]">
                  <div className="flex justify-between items-start mb-[12px]">
                    <h3 className="text-[18px] font-[600] text-[var(--color-text)] leading-[1.3]">{destination.name}</h3>
                    <div className="text-[16px] font-[600] text-primary whitespace-nowrap">{destination.price}</div>
                  </div>
                  <p className="text-[var(--color-text-secondary)] leading-normal mb-[20px]">
                    {destination.description}
                  </p>
                  <div className="flex max-[480px]:flex-col gap-[12px]">
                    <button className={BTN_PRIMARY_SM}>
                      <i className="fas fa-plane"></i>
                      Book Now
                    </button>
                    <button className={BTN_OUTLINE_SM}>
                      <i className="fas fa-info-circle"></i>
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-[24px] bg-gradient-to-br from-primary to-primary-active text-white relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-[url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&h=900&fit=crop')] before:bg-cover before:bg-center before:opacity-10 before:z-0">
        <div className="relative z-[1] max-w-[1280px] mx-auto px-[16px] max-[480px]:px-[12px]">
          <div className="text-center mb-[16px] max-[480px]:mb-[48px] max-w-[800px] mx-auto">
            <span className="relative inline-block text-[var(--color-warning)] text-[12px] font-[550] uppercase tracking-[0.1em] mb-[16px] after:content-[''] after:absolute after:-bottom-[8px] after:left-1/2 after:-translate-x-1/2 after:w-[40px] after:h-[2px] after:bg-[var(--color-warning)]">Customer Stories</span>
            <h2 className="text-[clamp(2rem,4vw,3rem)] max-[768px]:text-[2rem] max-[480px]:text-[20px] font-[600] text-white leading-tight mb-[24px] max-[480px]:mb-[16px]">What Our Travelers Say</h2>
            <p className="text-[16px] max-[480px]:text-[14px] text-white/90 leading-normal">
              Read genuine experiences from thousands of satisfied customers who
              trusted us with their dream vacations.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-[20px] border border-white/20 rounded-[12px] p-[32px] max-[480px]:p-[24px] transition-all duration-[250ms] hover:-translate-y-[4px] hover:bg-white/15">
                <div className="flex gap-[4px] mb-[16px]">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <i key={i} className="fas fa-star text-[var(--color-warning)] text-[12px]"></i>
                  ))}
                </div>
                <p className="text-[16px] leading-normal mb-[24px] italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-[16px]">
                  <img src={testimonial.image} alt={testimonial.name} className="w-[60px] h-[60px] rounded-full object-cover border-2 border-white/30" />
                  <div>
                    <h4 className="font-[600] mb-[4px]">{testimonial.name}</h4>
                    <p className="text-[12px] opacity-80 mb-[4px]">{testimonial.location}</p>
                    <span className="text-[11px] text-[var(--color-warning)] font-medium">{testimonial.trip}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-[24px] bg-gradient-to-br from-[var(--color-slate-900)] to-[var(--color-charcoal-800)] text-white text-center relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-[url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&h=900&fit=crop')] before:bg-cover before:bg-center before:opacity-20 before:z-0">
        <div className="max-w-[1280px] mx-auto px-[16px] max-[480px]:px-[12px]">
          <div className="relative z-[1] max-w-[800px] mx-auto">
            <div className="w-[120px] h-[120px] max-[480px]:w-[80px] max-[480px]:h-[80px] bg-gradient-to-br from-[var(--color-warning)] to-[var(--color-orange-400)] rounded-full flex items-center justify-center mx-auto mb-[32px] max-[480px]:mb-[20px] text-[48px] max-[480px]:text-[24px] text-white shadow-[var(--shadow-2xl)] [animation:float_3s_ease-in-out_infinite]">
              <i className="fas fa-paper-plane"></i>
            </div>
            <h2 className="text-[clamp(2rem,4vw,3rem)] max-[480px]:text-[20px] font-[600] mb-[24px] max-[480px]:mb-[16px] [text-shadow:0_2px_4px_rgba(0,0,0,0.3)] text-white">Ready to Start Your Adventure?</h2>
            <p className="text-[18px] max-[480px]:text-[14px] leading-normal mb-[40px] max-[480px]:mb-[24px] opacity-95">
              Join thousands of travelers who trust Bright Wings for their
              journeys. Create unforgettable memories with our premium travel
              services.
            </p>
            <div className="flex justify-center gap-[16px] mb-[40px] flex-wrap max-[768px]:flex-col max-[768px]:items-center">
              <button
                className={BTN_PRIMARY_LG}
                onClick={() => navigate("/auth")}
              >
                <i className="fas fa-user-plus"></i>
                Sign Up Now
              </button>
              <button
                className={BTN_OUTLINE_WHITE_LG}
                onClick={() => navigate("/auth")}
              >
                <i className="fas fa-sign-in-alt"></i>
                Sign In
              </button>
            </div>
            <div className="flex justify-center gap-[32px] max-[768px]:flex-col max-[768px]:gap-[16px] flex-wrap">
              <div className="flex items-center gap-[8px] text-[12px] font-medium">
                <i className="fas fa-check text-[var(--color-success)] text-[14px]"></i>
                <span>Free Account Setup</span>
              </div>
              <div className="flex items-center gap-[8px] text-[12px] font-medium">
                <i className="fas fa-check text-[var(--color-success)] text-[14px]"></i>
                <span>Instant Booking Access</span>
              </div>
              <div className="flex items-center gap-[8px] text-[12px] font-medium">
                <i className="fas fa-check text-[var(--color-success)] text-[14px]"></i>
                <span>Exclusive Member Deals</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[var(--color-slate-900)] text-white pt-[80px] pb-[32px]">
        <div className="max-w-[1280px] mx-auto px-[16px] max-[480px]:px-[12px]">
          <div className="grid grid-cols-1 min-[769px]:grid-cols-[1fr_2fr] gap-[16px] max-[1024px]:gap-[32px] mb-[48px]">
            <div className="max-w-[400px]">
              <div className="flex items-center gap-[12px] mb-[24px]">
                <div className="w-[48px] h-[48px] bg-gradient-to-br from-[var(--color-warning)] to-[var(--color-orange-400)] rounded-[12px] flex items-center justify-center text-white text-[18px] shadow-[var(--shadow-md)]">
                  <i className="fas fa-paper-plane"></i>
                </div>
                <div className="flex flex-col">
                  <span className="text-[18px] font-[600] text-white leading-none">Bright Wings</span>
                  <span className="text-[11px] text-[var(--color-gray-400)] font-medium leading-none">Travel & Tourism</span>
                </div>
              </div>
              <p className="text-[var(--color-gray-300)] leading-normal mb-[32px]">
                Your trusted partner for unforgettable travel experiences. We
                create moments that become memories to last a lifetime.
              </p>
              <div className="flex gap-[12px]">
                <span className="w-[48px] h-[48px] max-[480px]:w-[40px] max-[480px]:h-[40px] bg-[var(--color-charcoal-800)] rounded-full flex items-center justify-center text-white no-underline text-[16px] max-[480px]:text-[14px] transition-all duration-[250ms] hover:bg-primary hover:-translate-y-[2px]">
                  <i className="fab fa-facebook-f"></i>
                </span>
                <span className="w-[48px] h-[48px] max-[480px]:w-[40px] max-[480px]:h-[40px] bg-[var(--color-charcoal-800)] rounded-full flex items-center justify-center text-white no-underline text-[16px] max-[480px]:text-[14px] transition-all duration-[250ms] hover:bg-primary hover:-translate-y-[2px]">
                  <i className="fab fa-twitter"></i>
                </span>
                <span className="w-[48px] h-[48px] max-[480px]:w-[40px] max-[480px]:h-[40px] bg-[var(--color-charcoal-800)] rounded-full flex items-center justify-center text-white no-underline text-[16px] max-[480px]:text-[14px] transition-all duration-[250ms] hover:bg-primary hover:-translate-y-[2px]">
                  <i className="fab fa-instagram"></i>
                </span>
                <span className="w-[48px] h-[48px] max-[480px]:w-[40px] max-[480px]:h-[40px] bg-[var(--color-charcoal-800)] rounded-full flex items-center justify-center text-white no-underline text-[16px] max-[480px]:text-[14px] transition-all duration-[250ms] hover:bg-primary hover:-translate-y-[2px]">
                  <i className="fab fa-linkedin-in"></i>
                </span>
                <span className="w-[48px] h-[48px] max-[480px]:w-[40px] max-[480px]:h-[40px] bg-[var(--color-charcoal-800)] rounded-full flex items-center justify-center text-white no-underline text-[16px] max-[480px]:text-[14px] transition-all duration-[250ms] hover:bg-primary hover:-translate-y-[2px]">
                  <i className="fab fa-youtube"></i>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[32px] max-[480px]:gap-[20px]">
              <div>
                <h4 className="text-[16px] font-[600] text-white mb-[24px] relative after:content-[''] after:absolute after:-bottom-[8px] after:left-0 after:w-[30px] after:h-[2px] after:bg-[var(--color-warning)]">Services</h4>
                <ul className="list-none">
                  <li className="mb-[12px]">
                    <a href="#services" className="text-[var(--color-gray-300)] no-underline text-[12px] transition-all duration-[150ms] hover:text-white hover:pl-[8px]">
                      Flight Bookings
                    </a>
                  </li>
                  <li className="mb-[12px]">
                    <a href="#services" className="text-[var(--color-gray-300)] no-underline text-[12px] transition-all duration-[150ms] hover:text-white hover:pl-[8px]">
                      Hotel Reservations
                    </a>
                  </li>
                  <li className="mb-[12px]">
                    <a href="#services" className="text-[var(--color-gray-300)] no-underline text-[12px] transition-all duration-[150ms] hover:text-white hover:pl-[8px]">
                      Tour Packages
                    </a>
                  </li>
                  <li className="mb-[12px]">
                    <a href="#services" className="text-[var(--color-gray-300)] no-underline text-[12px] transition-all duration-[150ms] hover:text-white hover:pl-[8px]">
                      Visa Services
                    </a>
                  </li>
                  <li className="mb-[12px]">
                    <a href="#services" className="text-[var(--color-gray-300)] no-underline text-[12px] transition-all duration-[150ms] hover:text-white hover:pl-[8px]">
                      Travel Insurance
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-[16px] font-[600] text-white mb-[24px] relative after:content-[''] after:absolute after:-bottom-[8px] after:left-0 after:w-[30px] after:h-[2px] after:bg-[var(--color-warning)]">Destinations</h4>
                <ul className="list-none">
                  <li className="mb-[12px]">
                    <a href="#destinations" className="text-[var(--color-gray-300)] no-underline text-[12px] transition-all duration-[150ms] hover:text-white hover:pl-[8px]">
                      Europe Tours
                    </a>
                  </li>
                  <li className="mb-[12px]">
                    <a href="#destinations" className="text-[var(--color-gray-300)] no-underline text-[12px] transition-all duration-[150ms] hover:text-white hover:pl-[8px]">
                      Asia Adventures
                    </a>
                  </li>
                  <li className="mb-[12px]">
                    <a href="#destinations" className="text-[var(--color-gray-300)] no-underline text-[12px] transition-all duration-[150ms] hover:text-white hover:pl-[8px]">
                      America Explorations
                    </a>
                  </li>
                  <li className="mb-[12px]">
                    <a href="#destinations" className="text-[var(--color-gray-300)] no-underline text-[12px] transition-all duration-[150ms] hover:text-white hover:pl-[8px]">
                      Africa Safaris
                    </a>
                  </li>
                  <li className="mb-[12px]">
                    <a href="#destinations" className="text-[var(--color-gray-300)] no-underline text-[12px] transition-all duration-[150ms] hover:text-white hover:pl-[8px]">
                      Ocean Cruises
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-[16px] font-[600] text-white mb-[24px] relative after:content-[''] after:absolute after:-bottom-[8px] after:left-0 after:w-[30px] after:h-[2px] after:bg-[var(--color-warning)]">Support</h4>
                <ul className="list-none">
                  <li className="mb-[12px]">
                    <a href="#contact" className="text-[var(--color-gray-300)] no-underline text-[12px] transition-all duration-[150ms] hover:text-white hover:pl-[8px]">
                      Help Center
                    </a>
                  </li>
                  <li className="mb-[12px]">
                    <a href="#contact" className="text-[var(--color-gray-300)] no-underline text-[12px] transition-all duration-[150ms] hover:text-white hover:pl-[8px]">
                      Contact Us
                    </a>
                  </li>
                  <li className="mb-[12px]">
                    <a href="#contact" className="text-[var(--color-gray-300)] no-underline text-[12px] transition-all duration-[150ms] hover:text-white hover:pl-[8px]">
                      Booking Support
                    </a>
                  </li>
                  <li className="mb-[12px]">
                    <a href="#destinations" className="text-[var(--color-gray-300)] no-underline text-[12px] transition-all duration-[150ms] hover:text-white hover:pl-[8px]">
                      Travel Guides
                    </a>
                  </li>
                  <li className="mb-[12px]">
                    <a href="#contact" className="text-[var(--color-gray-300)] no-underline text-[12px] transition-all duration-[150ms] hover:text-white hover:pl-[8px]">
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-[16px] font-[600] text-white mb-[24px] relative after:content-[''] after:absolute after:-bottom-[8px] after:left-0 after:w-[30px] after:h-[2px] after:bg-[var(--color-warning)]">Contact Info</h4>
                <div className="flex flex-col items-start gap-[16px]">
                  <div className="flex items-center gap-[12px] text-[var(--color-gray-300)] text-[12px]">
                    <i className="fas fa-phone text-[var(--color-warning)] w-[20px] text-center"></i>
                    <span>+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-[12px] text-[var(--color-gray-300)] text-[12px]">
                    <i className="fas fa-envelope text-[var(--color-warning)] w-[20px] text-center"></i>
                    <span>info@brightwings.com</span>
                  </div>
                  <div className="flex items-center gap-[12px] text-[var(--color-gray-300)] text-[12px]">
                    <i className="fas fa-map-marker-alt text-[var(--color-warning)] w-[20px] text-center"></i>
                    <span>123 Travel St, Adventure City, AC 12345</span>
                  </div>
                  <div className="flex items-center gap-[12px] text-[var(--color-gray-300)] text-[12px]">
                    <i className="fas fa-clock text-[var(--color-warning)] w-[20px] text-center"></i>
                    <span>24/7 Customer Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--color-charcoal-800)] pt-[32px]">
            <div className="flex justify-between items-center gap-[16px] max-[768px]:flex-col max-[768px]:text-center">
              <p className="text-[var(--color-gray-400)] text-[12px]">
                &copy; 2025 Bright Wings Travel & Tourism. All rights reserved.
              </p>
              <div className="flex gap-[24px]">
                <span className="text-[var(--color-gray-400)] no-underline text-[12px] transition-all duration-[150ms] hover:text-white">
                  Privacy Policy
                </span>
                <span className="text-[var(--color-gray-400)] no-underline text-[12px] transition-all duration-[150ms] hover:text-white">
                  Terms of Service
                </span>
                <span className="text-[var(--color-gray-400)] no-underline text-[12px] transition-all duration-[150ms] hover:text-white">
                  Cookie Policy
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
