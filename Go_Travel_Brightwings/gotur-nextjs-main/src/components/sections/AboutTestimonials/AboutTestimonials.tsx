"use client";
import React from "react";

import Image from "next/image"; // Import Image from next/image
import { Container, Row, Col } from "react-bootstrap";
import { aboutTestimonialsData } from "@/data/aboutTestimonialsData";
import dynamic from "next/dynamic";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
// import ClientCarousel from "../ClientCarousel/ClientCarousel";

const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});
export interface Testimonial {
  image: string;
  text: string;
  authorName: string;
  position: string;
}

export interface AboutTestimonialsData {
  sectionTitle: string;
  sectionTagline: string;
  testiThumb: string;
  testimonials: Testimonial[];
  shapeImages: string[];
  brands: {
    image: string;
    hoverImage: string;
  }[];
}
const AboutTestimonials: React.FC = () => {
  const {
    sectionTitle,
    sectionTagline,
    testiThumb,
    testimonials,
    shapeImages,
    brands,
  }: AboutTestimonialsData = aboutTestimonialsData;
  return (
    <section className='about-testimonials section-space' id='testimonials'>
      <Container>
        <Row className=' align-items-center gutter-y-40'>
          <Col lg={4}>
            <div
              className='about-testimonials__left wow fadeInLeft'
              data-wow-duration='1500ms'
              data-wow-delay='300ms'
            >
              <div className='about-testimonials__thumb'>
                <div className='about-testimonials__thumb__item'>
                  <Image src={testiThumb} alt='man' width={400} height={100}/>
                </div>
              </div>
            </div>
          </Col>
          <Col lg={8}>
            <div className='about-testimonials__right'>
              <div className='sec-title'>
                <h6 className='sec-title__tagline bw-split-in-right'>
                  <TextAnimation text={sectionTagline} animationType='right' />
                </h6>
                <h3 className='sec-title__title bw-split-in-left'>
                  <TextAnimation text={sectionTitle} animationType='left' />
                </h3>
              </div>
              <div className='gotur-owl__carousel--basic-nav owl-carousel about-testimonials__carousel gotur-owl__carousel  owl-theme wow fadeInUp'>
                <TinySlider
                  settings={{
                    items: 1,
                    gutter: 30,
                    smartSpeed: 700,
                    loop: false,
                    nav: false,
                    autoplay: false,
                    controlsContainer:
                      ".gotur-owl__carousel--basic-nav .owl-nav",
                    mouseDrag: true,
                  }}
                  className=''
                >
                  {testimonials.map((testimonial, index) => (
                    <div className='about-testimonials__item' key={index}>
                      <div className='about-testimonials__star'>
                        <i className='icon-star'></i>
                        <i className='icon-star'></i>
                        <i className='icon-star'></i>
                        <i className='icon-star'></i>
                        <i className='icon-star'></i>
                      </div>
                      <p className='about-testimonials__text'>
                        {testimonial.text}
                      </p>
                      <div className='about-testimonials__author'>
                        <div className='about-testimonials__author__thumb'>
                          <Image src={testimonial.image} alt='author' height={200} width={200}/>
                        </div>
                        <div className='about-testimonials__content'>
                          <h6 className='about-testimonials__title'>
                            {testimonial.authorName}
                          </h6>
                          <span>{testimonial.position}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </TinySlider>
                <div className='owl-nav'>
                  <button
                    type='button'
                    role='presentation'
                    className='owl-prev disabled'
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
            </div>
          </Col>
        </Row>
        {/* <ClientCarousel /> */}
      </Container>
      <div className='about-testimonials__element-one'>
        <Image src={shapeImages[0]} alt='shape-image' height={100} width={200}/>
      </div>
      <div className='about-testimonials__element-two'>
        <Image src={shapeImages[1]} alt='shape-image' height={100} width={150}/>
      </div>
    </section>
  );
};

export default AboutTestimonials;
