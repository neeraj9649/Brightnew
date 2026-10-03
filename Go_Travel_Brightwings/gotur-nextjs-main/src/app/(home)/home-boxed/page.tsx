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
import TestimonialsThree from "@/components/sections/TestimonialsThree/TestimonialsThree";
import Layout from "@/components/layout/Layout/Layout";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import BoxWrapper from "@/components/layout/BoxWrapper/BoxWrapper";

export const metadata = {
  title: "Home Boxed || Gotur || Travel & Tour NextJS Template",
  description:
    "Gotur is a modern travel & tour booking NextJS Template. It is perfect for travel agencies, tour operators, trip holiday booking websites, adventure and booking companies looking for a unique and intuitive search function and all other travel & tourism websites and businesses.",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

export default function HomeBoxed() {
  return (
    <BoxWrapper>
      <TopbarOne extraClass='top-one--two' />
      <HeaderOne />
      <HeaderOneCloned />
      <MainSliderOne />
      <AboutTwo  cta={true} extraClass="about-two--two"/>
      <DestinationFilter />
      <CTAFive />
      <FeatureTwo />
      <OfferOne />
      <WhyChooseOne />
      <TestimonialsThree />
      <BlogFive />
      <InstagramOne extraClass='instagram-one--two' />
      <FooterOne />
    </BoxWrapper>
  );
}
