"use client";
import React from "react";
import { Col, Container } from "react-bootstrap";

import Masonry from "@/components/sections/MasonryWrapper/MasonryWrapper";
import Image, { StaticImageData } from "next/image";
import { galleryFilterData } from "@/data/galleryData";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import Link from "next/link";
interface GalleryItem {
  id: number;
  src: string;
  filterCategory: string[];
  col: number;
  lg: number;
  width: number;
  height: number;
}
const Gallery: React.FC = () => {
  return (
    <section className='gallery-page section-space'>
      <Container>
        <PhotoSwipeGallery>
          <Masonry className='row gutter-y-30 gutter-x-30'>
            {galleryFilterData.map((item: GalleryItem) => (
              <Col lg={4} md={6} key={item.id}>
                <div className='gallery-page__card'>
                  <Image src={item.src} alt={"Gallery image"} />
                  <div className='gallery-page__card__hover'>
                    <Item
                      original={item.src}
                      thumbnail={item.src}
                      width={item.width}
                      height={item.height}
                    >
                      {({ ref, open }) => (
                        <Link
                          href='#'
                          className='img-popup'
                          ref={ref}
                          onClick={(e) => {
                            e.preventDefault();
                            open(e);
                          }}
                        >
                          <div className='gallery-page__card__icon'>
                            <span className='gallery-page__card__icon__item'></span>
                          </div>
                        </Link>
                      )}
                    </Item>
                  </div>
                </div>
              </Col>
            ))}
          </Masonry>
        </PhotoSwipeGallery>
      </Container>
    </section>
  );
};

export default Gallery;
