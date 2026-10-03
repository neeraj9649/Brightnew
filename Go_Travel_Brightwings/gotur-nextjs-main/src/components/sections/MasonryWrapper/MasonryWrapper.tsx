// components/MasonryWrapper.tsx
"use client";
import React, { ComponentClass, PropsWithChildren } from "react";
import OriginalMasonry, { MasonryPropTypes } from "react-masonry-component";

// Extend Masonry to include `children`
const Masonry = OriginalMasonry as ComponentClass<
  MasonryPropTypes & { children?: React.ReactNode }
>;

const MasonryWrapper: React.FC<PropsWithChildren<MasonryPropTypes>> = ({
  children,
  ...props
}) => {
  return <Masonry {...props}>{children}</Masonry>;
};

export default MasonryWrapper;
