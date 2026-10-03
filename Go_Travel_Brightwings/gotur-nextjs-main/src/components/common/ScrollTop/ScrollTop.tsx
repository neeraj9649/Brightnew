"use client";

import React, { useEffect, useState } from "react";
import ScrollToTop from "react-scroll-to-top";

const ScrollTop = () => {
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const bodyHeight = document.body.scrollHeight - window.innerHeight;
      const scrollPos = window.scrollY;
      let percentage = (scrollPos / bodyHeight) * 100;
      if (percentage > 100) {
        percentage = 100;
      }
      setPercentage(percentage);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
     <ScrollToTop
     smooth
     // className="scroll-top"
     // id="scroll-top"
     style={{ background: `conic-gradient(var(--gotur-primary) ${percentage}%, var(--gotur-white) ${percentage}%)`}}
     component={
       
        <span id="scroll-top-value" className="scroll-top-value">
       {percentage === 100 ? (
          <i className="fas fa-arrow-up"></i> // Show the up arrow icon at 100%
        ) : (
          `${Math.round(percentage)}%`
         )}
       </span>
    
     
     }
   />
//     <div
//       id="scroll-top"
//       className="scroll-top active"
//       style={{
//         background: `conic-gradient(var(--gotur-primary) ${percentage}%, var(--gotur-white) ${percentage}%)`
//       }}
//     >
//       <span id="scroll-top-value" className="scroll-top-value">
//       {percentage === 100 ? (
//           <i className="fas fa-arrow-up"></i> // Show the up arrow icon at 100%
//         ) : (
//           `${Math.round(percentage)}%`
//         )}
//       </span>
//     </div>
  );
};

export default ScrollTop;
