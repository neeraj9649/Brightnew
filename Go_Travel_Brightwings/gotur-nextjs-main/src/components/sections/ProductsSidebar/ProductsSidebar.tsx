"use client";
import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import Slider from "rc-slider";
import Link from "next/link";

import { productSidebarData } from "@/data/productsSidebarData";
interface SidebarCategory {
  name: string;
  link: string;
}

interface ColorFilter {
  color: string;
  count: number;
}

interface SizeFilter {
  size: string;
  count: number;
}

interface PriceRange {
  min: string;
  max: string;
}

interface ProductSidebarData {
  categories: SidebarCategory[];
  colorFilters: ColorFilter[];
  sizeFilters: SizeFilter[];
  priceRange: PriceRange;
  statusFilters: SidebarCategory[];
}
const ProductsSidebar: React.FC = () => {
  const {
    categories,
    colorFilters,
    sizeFilters,
    priceRange,
    statusFilters,
  }: ProductSidebarData = productSidebarData;
  const [sliderValue, setSliderValue] = useState<number[]>([80, 500]);
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchTerm = formData.get("search");
    console.log("Search submitted:", searchTerm);
  };

  const handleSlideChange = (value: number | number[]) => {
    if (Array.isArray(value) && value.length === 2) {
      setSliderValue([value[0], value[1]]);
    }
  };
  return (
    <aside className='product__sidebar'>
      <div
        className='product__search-box product__sidebar__item wow fadeInLeft'
        data-wow-duration='1500ms'
        data-wow-delay='400ms'
      >
        <Form className='product__search' onSubmit={handleSearch}>
          <Form.Control type='text' name='search' placeholder='Search Items' />
          <Button variant='outline-secondary' type='submit'>
            <span className='icon-search'></span>
          </Button>
        </Form>
      </div>

      <div
        className='product__price-ranger product__sidebar__item wow fadeInLeft'
        data-wow-duration='1500ms'
        data-wow-delay='400ms'
      >
        <h3 className='product__sidebar__title'>Filter by price</h3>
        <Form className='price-ranger'>
          <Slider
            range
            allowCross={false}
            value={sliderValue}
            onChange={handleSlideChange}
            max={1000}
            min={0}
            className='range-slider-price'
            id='slider-range'
          />
          <div className='ranger-min-max-block'>
            <div className='left'>
              <p>
                $ <span className='min'>{sliderValue[0]}</span>
              </p>

              <span>-</span>
              <p>
                $ <span className='max'>{sliderValue[1]}</span>
              </p>
            </div>
          </div>
        </Form>
      </div>

      {/* Categories */}
      <div
        className='product__categories product__sidebar__item wow fadeInLeft'
        data-wow-duration='1500ms'
        data-wow-delay='400ms'
      >
        <h3 className='product__sidebar__title product__categories__title'>
          Categories
        </h3>
        <ul className='list-unstyled'>
          {categories.map((category, index) => (
            <li key={index}>
              <Link href={category.link}>
                <span className='product-categories__icon'>
                  <i className='icon-arrow-point-to-right'></i>
                </span>
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Color Filter */}
      <div
        className='product__color product__sidebar__item wow fadeInLeft'
        data-wow-duration='1500ms'
        data-wow-delay='400ms'
      >
        <h3 className='product__sidebar__title product__color__title'>
          Filter by Color
        </h3>
        <ul className='list-unstyled'>
          {colorFilters.map((color, index) => (
            <li key={index}>
              <p className='product__color__text'>
                <span
                  className='product__color__item'
                  style={{ backgroundColor: color.color.toLowerCase() }}
                ></span>
                {color.color}
              </p>
              <span>{color.count}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Product Status */}
      <div
        className='product__categories product__sidebar__item wow fadeInLeft'
        data-wow-duration='1500ms'
        data-wow-delay='400ms'
      >
        <h3 className='product__sidebar__title product__categories__title'>
          Product Status
        </h3>
        <ul className='list-unstyled'>
          {statusFilters.map((status, index) => (
            <li key={index}>
              <Link href={status.link}>
                <span className='product-categories__icon'>
                  <i className='icon-arrow-point-to-right'></i>
                </span>
                {status.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Size Filter */}
      <div
        className='product__size product__sidebar__item wow fadeInLeft'
        data-wow-duration='1500ms'
        data-wow-delay='400ms'
      >
        <h3 className='product__sidebar__title product__size__title'>
          Filter by Sizes
        </h3>
        <ul className='list-unstyled'>
          {sizeFilters.map((size, index) => (
            <li key={index}>
              <p className='product__size__text'>{size.size}</p>
              <span>{size.count}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Review Star Filter */}
      <div
        className='product__rating product__sidebar__item wow fadeInLeft'
        data-wow-duration='1500ms'
        data-wow-delay='400ms'
      >
        <h3 className='product__sidebar__title product__rating__title'>
          Review star
        </h3>
        <ul className='list-unstyled'>
          {[5, 4, 3, 2, 1].map((stars) => (
            <li key={stars}>
              <div className='product__rating__check'>
                <input
                  type='checkbox'
                  name={`check${stars}`}
                  id={`check${stars}`}
                />
                <label htmlFor={`check${stars}`}></label>
              </div>
              <div className='product__rating__star'>
                {[...Array(stars)].map((_, index) => (
                  <i key={index} className='fas fa-star'></i>
                ))}
                <span>{stars} & up</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default ProductsSidebar;
