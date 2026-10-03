'use client';
import CustomCursor from "@/components/common/CustomCursor/CustomCursor";
import ScrollTop from "@/components/common/ScrollTop/ScrollTop";
import React, { ReactNode, useEffect } from "react";

interface BoxProps {
  children: ReactNode;
}

const BoxWrapper: React.FC<BoxProps> = ({ children }) => {
    useEffect(() => {
        document.body.classList.add("boxed-wrapper");
    
        return () => {
          document.body.classList.remove("boxed-wrapper");
        };
      }, []);
  return (

  <div className='page-wrapper'>
    <CustomCursor />
      {children}
      <ScrollTop />
    </div>
    
  
  );
};

export default BoxWrapper;