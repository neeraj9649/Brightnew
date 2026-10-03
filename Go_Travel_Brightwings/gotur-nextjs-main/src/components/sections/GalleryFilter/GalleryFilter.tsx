"use client";
import React, { useState } from "react";
import { Col, Container } from "react-bootstrap";

import Masonry from "@/components/sections/MasonryWrapper/MasonryWrapper";
import Image from "next/image";
import { filterCategories, galleryFilterData } from "@/data/galleryData";
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
interface FilterCategory {
  name: string;
  filter: string;
}
type FilterType =
  | "filter-item"
  | "room"
  | "restaurant"
  | "hotel"
  | "design"
  | "photography"
  | "branding";
const getFilteredProjects = (filterData: string): GalleryItem[] => {
  return filterData === "filter-item"
    ? galleryFilterData
    : galleryFilterData.filter((project) =>
        project.filterCategory.includes(filterData)
      );
};
const GalleryFilter: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>("filter-item");

  const filteredProjects = getFilteredProjects(activeFilter);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };
  return (
    <section className='gallery-page section-space'>
      <Container>
        <div className='text-center'>
          <ul className='list-unstyled post-filter gallery-page__filter__list'>
            {filterCategories.map((item: FilterCategory) => (
              <li
                key={item.name}
                className={item.filter === activeFilter ? "active" : ""}
                onClick={() => handleFilterChange(item.filter)}
              >
                <span className='gotur-btn main-header__btn'> {item.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <PhotoSwipeGallery>
          <Masonry className='row gutter-y-30 gutter-x-30'>
            {filteredProjects.map((item: GalleryItem) => (
              <Col lg={4} md={6} key={item.id}>
                <div className='gallery-page__card'>
                  <Image src={item.src} alt={"Gallery image"} width={100} height={100} />
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

export default GalleryFilter;
