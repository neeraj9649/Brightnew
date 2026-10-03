declare module 'react-curved-text' {
     import React from 'react';
   
     interface ReactCurvedTextProps {
       text: string;
       radius: number;
       fontSize: number;
       fontWeight?: number;
       fill?: string;
       reversed?: boolean;
       width: number;
       height: number;
       cx: number;
       cy: number;
       rx: number;
       ry: number;
       tspanProps?: object;
    
     }
   
     const ReactCurvedText: React.FC<ReactCurvedTextProps>;
   
     export default ReactCurvedText;
   }