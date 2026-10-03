"use client";
import testimonialsTwoData from "@/data/testimonialsTwoData";
import Image, { StaticImageData } from "next/image";
import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import dynamic from "next/dynamic";
const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});
interface Testimonial {
  id: number;
  name: string;
  position?: string;
  text: string;
  image: string;
  stars?: number;
}

interface TestimonialsData {
  tagline: string;
  title: string;
  highlighted: string;
  elementImage: string;
  testimonials: Testimonial[];
}
const TestimonialsPageCarousel: React.FC = () => {
  const { testimonials }: TestimonialsData = testimonialsTwoData;
  return (
    <section className='testimonial-page section-space'>
      <Container>
        <div className='testimonial-page__carousel gotur-owl__carousel gotur-owl__carousel--with-shadow gotur-owl__carousel--basic-nav owl-carousel owl-theme owl-loaded owl-drag'>
          <TinySlider
            settings={{
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
                  items: 2,
                },
              },
            }}
          >
            {testimonials.map((testimonial: Testimonial) => (
              <div key={testimonial.id}>
                <div
                  className='testimonials-two-card testimonials-two-card--two  wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay='00ms'
                >
                  <div className='testimonials-two-card__inner'>
                    <div className='testimonials-two-card__top'>
                      <Image
                        src={testimonial.image}
                        alt='testiomonials author'
                      />
                    </div>
                    <div className='testimonials-two-card__content testimonials-two-card__content--two'>
                      <div className='testimonials-two-card__author'>
                        <h4 className='testimonials-two-card__author__name'>
                          {testimonial.name}
                        </h4>
                        <p className='testimonials-two-card__author__dec'>
                          {testimonial.position}
                        </p>
                      </div>
                      <p className='testimonials-two-card__text'>
                        {testimonial.text}
                      </p>
                    </div>
                    <div className='testimonials-two-card__star testimonials-two-card__star--two'>
                      <div className='testimonials-two-card__star__item'>
                        <i className='icon-star'></i>
                        <i className='icon-star'></i>
                        <i className='icon-star'></i>
                        <i className='icon-star'></i>
                        <i className='icon-star'></i>
                      </div>
                    </div>
                    <div className='testimonials-two-card__quite'>
                      <i className='icon-straight-quotes'></i>
                    </div>
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

export default TestimonialsPageCarousel;
