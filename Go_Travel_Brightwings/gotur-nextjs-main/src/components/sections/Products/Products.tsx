'use client';

import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';

import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import { products } from '@/data/products';
import CustomReactSelect from '@/components/common/CustomReactSelect/CustomReactSelect';
import CustomReactSelectTwo from '@/components/common/CustomReactSelecTwo/CustomReactSelectTwo';
const options =[
  // { value: "", label: "Sort by view" },
  { value: "1", label: "Sort by view" },
  { value: "2", label: "Sort by price" },
  { value: "3", label: "Sort by ratings" },]
 interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
    rating: number;
    slug: string;
  }
const Products: React.FC = () => {

  const [filterValues, setFilterValues] = useState< string >(
    ''
  );

  const onFilterChange = ( value: string) => {
    setFilterValues(value);
  };

  return (
    <section className="product-page section-space">
      <Container>
        <Row className="justify-content-center gutter-y-40">
          <Col lg={12}>
            <div className="product__info-top d-flex justify-content-between align-items-center mb-4">
              <div className="product__showing-text-box">
                <p className="product__showing-text">Showing 1–{products.length} of {products.length} Results</p>
              </div>
              <div className="product__showing-sort">
              <CustomReactSelectTwo
                      options={options}
                      value={filterValues || ""}
                      onChange={(val) => onFilterChange( val)}
                      placeholder="Default Sorting"
                    />
                
              </div>
            </div>

            <Row className="gutter-y-30">
              {products.map((product: Product, index: number) => (
                <Col xl={3} lg={4} sm={6} key={product.id}>
                  <div className="product__item wow fadeInUp" data-wow-duration="1500ms" data-wow-delay={`${index * 200}ms`}>
                    <div className="product__item__image">
                      <Image src={product.image} alt={product.name} className="img-fluid" />
                    </div>
                    <div className="product__item__content">
                      <div className="product__item__star">
                        {Array.from({ length: product.rating }).map((_, i) => (
                          <i key={i} className="fas fa-star"></i>
                        ))}
                      </div>
                      <h4 className="product__item__title">
                        <Link href={`/product/${product.slug}`}>{product.name}</Link>
                      </h4>
                      <div className="product__item__price">${product.price.toFixed(2)}</div>
                      <Link href="/cart" className="gotur-btn gotur-btn--base">
                        Add to Cart <span className="gotur-btn__icon"><i className="icon-shopping-carts"></i></span>
                      </Link>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Products;
