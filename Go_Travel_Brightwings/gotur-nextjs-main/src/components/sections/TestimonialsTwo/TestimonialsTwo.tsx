"use client";
import Image, { StaticImageData } from "next/image";
import { useState } from "react";

import { Carousel, Container, Row, Col, Button } from "react-bootstrap";
import dynamic from "next/dynamic";
import testimonialsTwoData from "@/data/testimonialsTwoData";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
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

const TestimonialsTwo = () => {
  const {
    tagline,
    title,
    highlighted,
    testimonials,
    elementImage,
  }: TestimonialsData = testimonialsTwoData;
  const settings = {
    items: 1,
    gutter: 30,
    loop: false,
    nav: false,
    autoplay: false,
    controls: true,
    mouseDrag: true,
    controlsContainer: ".testimonials-two__bottom__nav",
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
      1199: {
        items: 2,
      },
    },
  };
  return (
    <section className='testimonials-two' id='testimonials'>
      <Container fluid>
        <Row className='align-items-center gy-4'>
          <Col xl={4} xxl={3}>
            <div className='mb-4'>
              <div className='sec-title'>
                <h6 className='sec-title__tagline'>
                  <TextAnimation text={tagline} animationType='right' />
                </h6>
                <h3 className='sec-title__title'>
                  <TextAnimation text={title} animationType='left' />

                  <span>
                    <TextAnimation text={highlighted} animationType='left' />
                  </span>
                </h3>
              </div>
              <div className='testimonials-two__bottom__nav'>
                <button className='testimonials-two__carousel__nav--left'>
                  <span className='icon-arrow-left'></span>
                </button>
                <button className='testimonials-two__carousel__nav--right'>
                  <span className='icon-arrow-right'></span>
                </button>
              </div>
            </div>
          </Col>

          <Col xl={8} xxl={9}>
            <TinySlider
              settings={settings}
              className='testimonials-two__carousel gotur-owl__carousel gotur-owl__carousel--custom-nav gotur-owl__carousel--with-shadow owl-carousel owl-theme'
            >
              {testimonials.map((testimonial: Testimonial) => (
                <div key={testimonial.id}>
                  <div
                    className='testimonials-two-card  wow fadeInUp'
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
                      <div className='testimonials-two-card__content'>
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
                      <div className='testimonials-two-card__star'>
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
          </Col>
        </Row>
      </Container>
      <div className='testimonials-two__element'>
        <Image src={elementImage} alt='' />
      </div>
    </section>
  );
};

export default TestimonialsTwo;
