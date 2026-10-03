import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
// import BlogListRight from "@/components/sections/BlogListLeft/BlogListLeft";
import HeaderInner from "@/components/layout/HeaderInner/HeaderInner";
import HeaderInnerCloned from "@/components/layout/HeaderInnerCloned/HeaderInnerCloned";

export const metadata = {
  title: "Blog List Right || Gotur || Travel & Tour NextJS Template",
  description:
    "Gotur is a modern travel & tour booking NextJS Template. It is perfect for travel agencies, tour operators, trip holiday booking websites, adventure and booking companies looking for a unique and intuitive search function and all other travel & tourism websites and businesses.",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

export default function Blog() {
  return (
    <Layout>
      <TopbarOne />
      <HeaderInner />
      <HeaderInnerCloned/>
      <PageHeader
        title='standard blog Right Sidebar'
        subTitle='standard blog'
      />
      {/* <BlogListRight />/ */}
      <FooterOne />
    </Layout>
  );
}
