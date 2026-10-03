// components/DarkModeProvider.tsx
"use client";

import React, { createContext, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

// Define an interface for the context (expand as needed)
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DarkModeContextType {}

// Create the context with an empty default value
export const DarkModeContext = createContext<DarkModeContextType>({});

// Define the props for the provider
interface DarkModeProviderProps {
  children: ReactNode;
}

export const DarkModeProvider: React.FC<DarkModeProviderProps> = ({
  children,
}) => {
  const pathname = usePathname();

  const updateDarkMode = () => {
    const darkPages = [
      "/index-dark",
      "/index-2-dark",
      "/index-3-dark",
      "/index-4-dark",
    ];
    if (pathname && darkPages.includes(pathname)) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  };

  useEffect(() => {
    updateDarkMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <DarkModeContext.Provider value={{}}>{children}</DarkModeContext.Provider>
  );
};
