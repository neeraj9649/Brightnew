'use client'
import CustomReactSelectTwo from '@/components/common/CustomReactSelecTwo/CustomReactSelectTwo';
import Pagination from '@/components/common/Pagination/Pagination';
import { products } from '@/data/products';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';

const options =[
  
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

const ProductsList: React.FC = () => {
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
            <Col lg={9}>
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
                  <Col xs={12} key={product.id}>
                    <div className="product-list__item wow fadeInUp" data-wow-duration="1500ms" data-wow-delay={`${index * 200}ms`}>
                      <Row className='align-items-center gutter-y-30'>
                        <Col md={4}>
                        <div className="product-list__item__image">
                        <Image src={product.image} alt={product.name} className="img-fluid" />
                      </div>
                        </Col>
                        <Col md={8}>
                        <div className="product-list__item__content">
                        <h4 className="product-list__item__title">
                          <Link href={`/product/${product.slug}`}>{product.name}</Link>
                        </h4>
                        <div className="product-list__item__star">
                          {Array.from({ length: product.rating }).map((_, i) => (
                            <i key={i} className="fas fa-star"></i>
                          ))}
                        </div>
                        <p className="product-list__item__text">Lorem ipsum dolor sit amet consectetur. Nunc sit morbi turpis sed volutpat egestas. Mollis scelerisque a sem morbi sed donec eu.</p>
                       
                        <div className="product-list__item__price">${product.price.toFixed(2)}</div>
                        <Link href="/cart" className="gotur-btn gotur-btn--base">
                          Add to Cart <span className="gotur-btn__icon"><i className="icon-shopping-carts"></i></span>
                        </Link>
                      </div>
                        </Col>
                      </Row>
                     
                     
                    </div>
                  </Col>
                ))}
                <Col lg={12}>
                <Pagination/></Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </section>
    );
};

export default ProductsList;