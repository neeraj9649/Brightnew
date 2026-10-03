// context/RtlModeContext.tsx
"use client";

import React, { createContext, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

export interface RtlModeContextProps {
  updateRtlMode: () => void;
}

const defaultValue: RtlModeContextProps = {
  updateRtlMode: () => {},
};

export const RtlModeContext = createContext<RtlModeContextProps>(defaultValue);

interface RtlModeProviderProps {
  children: ReactNode;
}

export const RtlModeProvider: React.FC<RtlModeProviderProps> = ({
  children,
}) => {
  const pathname = usePathname();

  const updateRtlMode = () => {
    const rtlPages = ["/home-rtl"];
    if (rtlPages.includes(pathname)) {
      document.body.classList.add("rtl");
    } else {
      document.body.classList.remove("rtl");
    }
  };

  useEffect(() => {
    updateRtlMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <RtlModeContext.Provider value={{ updateRtlMode }}>
      {children}
    </RtlModeContext.Provider>
  );
};
