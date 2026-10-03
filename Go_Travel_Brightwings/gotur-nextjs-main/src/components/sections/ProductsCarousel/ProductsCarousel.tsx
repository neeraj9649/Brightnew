'use client';
import React from 'react';
import dynamic from "next/dynamic";
import { Container } from 'react-bootstrap';
import Link from 'next/link';
import Image, { StaticImageData } from 'next/image';
import { products } from '@/data/products';
const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});
interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
    rating: number;
    slug: string;
  }
const ProductsCarousel: React.FC = () => {
    return (
        <section className="product-page section-space">
      <Container>
        <div className='product-page__carousel gotur-owl__carousel gotur-owl__carousel--with-shadow gotur-owl__carousel--basic-nav owl-carousel owl-theme owl-loaded owl-drag'>
            <TinySlider   settings={{
              items: 1,
              gutter: 30,
              loop: false,
              nav: false,
              autoplay: false,
              controls: true,
              mouseDrag: true,
              controlsContainer: ".owl-nav",
              responsive: {
                0: {
                  items: 1,
                },
                768: {
                  items: 2,
                },
                992: {
                  items: 3,
                },
                1199:{
                  items: 4,
                }
              },
            }}>
            {products.map((product: Product, index: number) => (
                <div className="item" key={product.id}>
                <div className="product__item wow fadeInUp animated" data-wow-duration="1500ms" data-wow-delay={`${index * 200}ms`}>
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
              </div>
            ))}
            </TinySlider>
            <div className='owl-nav'>
            <button
              type='button'
              role='presentation'
              className='owl-prev'
              aria-label='carousel button'
            >
              <span className='icon-arrow-left'></span>
            </button>
            <button
              type='button'
              role='presentation'
              className='owl-next'
              aria-label='carousel button'
            >
              <span className='icon-arrow-right'></span>
            </button>
          </div>
        </div>
      </Container>
            
        </section>
    );
};

export default ProductsCarousel;