"use client";

import { use, useEffect } from "react";
import useStore from "@/store/useStore";
import { usePathname } from "next/navigation";

const LayoutObserver = () => {
  const {
    mobileDrawerStatus,
    mobileDrawerTwoStatus,
    changeMobileDrawerStatus,
    changeMobileDrawerTwoStatus,
    setMobileDrawerTwoStatus,
    setMobileDrawerStatus,
    setSideBarDrawerStatus,
  } = useStore();
  const pathname = usePathname();
  useEffect(() => {
    if (mobileDrawerStatus || mobileDrawerTwoStatus) {
      document.body.classList.add("megamenu-popup-active");
    } else {
      document.body.classList.remove("megamenu-popup-active");
    }

    return () => {
      document.body.classList.remove("megamenu-popup-active");
    };
  }, [mobileDrawerStatus, mobileDrawerTwoStatus]);

  useEffect(() => {
    if (mobileDrawerStatus) {
      setMobileDrawerStatus(false);
    }
    if (mobileDrawerTwoStatus) {
      setMobileDrawerTwoStatus(false);
    }
    // setSideBarDrawerStatus(false);
  }, [pathname]);

  return null;
};

export default LayoutObserver;
