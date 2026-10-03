"use client";

import { Plus_Jakarta_Sans, Just_Another_Hand } from "next/font/google";
import "@/assets/vendors/fontawesome/css/all.min.css";
// import "@/assets/vendors/icofont/icofont.min.css";
import "@/assets/vendors/gotur-icons/style.css";
import "@/assets/vendors/animate/animate.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "tiny-slider/dist/tiny-slider.css";
import "photoswipe/dist/photoswipe.css";
import "react-datepicker/dist/react-datepicker.css";
import "rc-slider/assets/index.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
// import "@/assets/css/careox-dark.css";
import "@/assets/css/gotur-rtl.css";
import "@/assets/css/gotur-custom-rtl.css";
import "@/assets/css/custom.css";

// import "./globals.css";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DarkModeProvider } from "@/context/DarkModeProvider";
import { RtlModeProvider } from "@/context/RtlModeContext";
import Preloader from "@/components/common/Preloader/Preloader";
import Drawer from "@/components/layout/Drawer/Drawer";
import Sidebar from "@/components/common/Sidebar/Sidebar";
import useWow from "@/hooks/useWow";
import DrawerTwo from "@/components/layout/DrawerTwo/DrawerTwo";
import LayoutObserver from "@/components/layout/LayoutObserver/LayoutObserver";
import StyleSwitcher from "@/components/layout/StyleSwitcher/StyleSwitcher";
import Search from "@/components/common/Search/Search";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const justAnotherHand = Just_Another_Hand({
  variable: "--font-just-another-hand",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    setShowPreloader(true);
    const timer = setTimeout(() => setShowPreloader(false), 1000);
    return () => clearTimeout(timer);
  }, [pathname]);
  useWow();
  return (
    <html lang='en'>
      <body className={`${jakartaSans.variable} ${justAnotherHand.variable}`}>
        <DarkModeProvider>
          <RtlModeProvider>
            {showPreloader && <Preloader />}
            <StyleSwitcher />
            {children}
            <LayoutObserver />
            <Drawer />
            <DrawerTwo />
            <Sidebar />
            <Search />
          </RtlModeProvider>
        </DarkModeProvider>
      </body>
    </html>
  );
}
