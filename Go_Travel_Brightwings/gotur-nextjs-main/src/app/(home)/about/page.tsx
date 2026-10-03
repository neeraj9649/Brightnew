import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import InstagramOne from "@/components/sections/InstagramOne/InstagramOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import AboutOne from "@/components/sections/AboutOne/AboutOne";
import CtaTwo from "@/components/sections/CtaTwo/CtaTwo";
import HowItWorks from "@/components/sections/HowItWorks/HowItWorks";
import AboutTestimonials from "@/components/sections/AboutTestimonials/AboutTestimonials";
import HeaderInner from "@/components/layout/HeaderInner/HeaderInner";
import HeaderInnerCloned from "@/components/layout/HeaderInnerCloned/HeaderInnerCloned";

export const metadata = {
  title: "About Us || Gotur || Travel & Tour NextJS Template",
  description:
    "Gotur is a modern travel & tour booking NextJS Template. It is perfect for travel agencies, tour operators, trip holiday booking websites, adventure and booking companies looking for a unique and intuitive search function and all other travel & tourism websites and businesses.",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

export default function About() {
  return (
    <Layout>
      <TopbarOne />
      <HeaderInner />
      {/* <HeaderOne /> */}
      <HeaderInnerCloned/>
      <PageHeader title='About Us' subTitle='About Us' />
      <AboutOne />
      <CtaTwo />
      <HowItWorks />
      <AboutTestimonials />
      <InstagramOne />
      <FooterOne />
    </Layout>
  );
}
