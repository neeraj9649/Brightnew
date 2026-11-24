import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import MainSliderOne from "@/components/sections/MainSliderOne/MainSliderOne";
import AboutTwo from "@/components/sections/AboutTwo/AboutTwo";
import DestinationFilter from "@/components/sections/DestinationFilter/DestinationFilter";
import BlogFive from "@/components/sections/BlogFive/BlogFive";
import WhyChooseOne from "@/components/sections/WhyChooseOne/WhyChooseOne";
import CTAFive from "@/components/sections/CtaFive/CtaFive";
import FeatureTwo from "@/components/sections/FeatureTwo/FeatureTwo";
import OfferOne from "@/components/sections/OfferOne/OfferOne";
import InstagramOne from "@/components/sections/InstagramOne/InstagramOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";


// import "@/assets/css/gotur-landing.css";

export const metadata = {
  title: "Brightwings | Tour & Travel Company",
  description:
    "Brightwings is a modern travel & tour booking web application. It is perfect for travel agencies, tour operators, trip holiday booking websites, adventure and booking companies looking for a unique and intuitive search function and all other travel & tourism websites and businesses.",
  icons: {
    icon: "/BrightLogo.png",
  },
};

export default function Home() {
  return (
    <Layout>
      <TopbarOne extraClass='top-one--two' />
      <HeaderOne />
      <HeaderOneCloned />
      <MainSliderOne />
      <AboutTwo cta={true} extraClass='about-two--two' />
      <DestinationFilter />
      <CTAFive />
      <FeatureTwo />
      <OfferOne />
      <WhyChooseOne />
      {/* Testimonials hidden for now; put <TestimonialsThree /> back here to show them again. */}
      <BlogFive />
      <InstagramOne extraClass='instagram-one--two' />
      <FooterOne />
    </Layout>
  );
}
