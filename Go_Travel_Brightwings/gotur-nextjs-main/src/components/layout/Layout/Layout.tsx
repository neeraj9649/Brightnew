import CustomCursor from "@/components/common/CustomCursor/CustomCursor";
import ScrollTop from "@/components/common/ScrollTop/ScrollTop";
import React, { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className='page-wrapper'>
      <CustomCursor />
      {children}
      <ScrollTop />
    </div>
  );
};

export default Layout;
