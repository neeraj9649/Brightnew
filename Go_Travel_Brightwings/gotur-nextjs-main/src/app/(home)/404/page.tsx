import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import HeaderTwo from "@/components/layout/HeaderTwo/HeaderTwo";
import HeaderTwoCloned from "@/components/layout/HeaderTwoCloned/HeaderTwoCloned";

import Error404 from "@/components/sections/Error404/Error404";

export const metadata = {
  title: "Error Page || Gotur || Travel & Tour NextJS Template",
  description:
    "Gotur is a modern travel & tour booking NextJS Template. It is perfect for travel agencies, tour operators, trip holiday booking websites, adventure and booking companies looking for a unique and intuitive search function and all other travel & tourism websites and businesses.",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

export default function PricingPage() {
  return (
    <Layout>
      <TopbarOne />
      <HeaderTwo />
      <HeaderTwoCloned />
      <PageHeader title='Error Page' subTitle='404' />
      <Error404 />
      <FooterOne />
    </Layout>
  );
}
