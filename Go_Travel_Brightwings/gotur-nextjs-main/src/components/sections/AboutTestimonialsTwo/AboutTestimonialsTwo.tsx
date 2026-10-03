"use client";
import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import Image, { StaticImageData } from "next/image";
import { aboutTestimonialsTwoData } from "@/data/aboutTestimonialsTwoData";
import dynamic from "next/dynamic";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";

const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});
// Define the types
interface Testimonial {
  name: string;
  role: string;
  text: string;
  image: string;
}

interface AboutTestimonialsTwoData {
  tagline: string;
  title: string;
  titleSpan: string;
  thumb: string;
  thumbShape: string;
  thumbShapeOne: string;
  thumbShapeTwo: string;
  thumbShapeThree: string;
  buttonBg: string;
  testimonials: Testimonial[];
  elementImage: string;
}

const AboutTestimonialsTwo: React.FC = () => {
  const {
    tagline,
    title,
    titleSpan,
    thumb,
    thumbShape,
    thumbShapeOne,
    thumbShapeTwo,
    thumbShapeThree,
    buttonBg,
    testimonials,
    elementImage,
  }: AboutTestimonialsTwoData = aboutTestimonialsTwoData;

  return (
    <section
      className='about-testimonials about-testimonials--two section-space'
      id='testimonials'
    >
      <Container>
        <Row className='align-items-center gutter-y-40'>
          <Col lg={5}>
            <div
              className='about-testimonials__left wow fadeInLeft'
              data-wow-duration='1500ms'
              data-wow-delay='400ms'
            >
              <div className='about-testimonials__thumb'>
                <div className='about-testimonials__thumb__item'>
                  <Image src={thumb} alt='man' />
                </div>
                <div className='about-testimonials__thumb__shape'>
                  <Image src={thumbShape} alt='' />
                </div>
                <div className='about-testimonials__thumb__shape-one'>
                  <Image src={thumbShapeOne} alt='' />
                </div>
                <div className='about-testimonials__thumb__shape-two'>
                  <Image src={thumbShapeTwo} alt='' />
                </div>
                <div className='about-testimonials__thumb__shape-three'>
                  <Image src={thumbShapeThree} alt='' />
                </div>
              </div>
            </div>
          </Col>

          <Col lg={7}>
            <div className='about-testimonials__right'>
              <div className='sec-title'>
                <h6 className='sec-title__tagline bw-split-in-right'>
                  <TextAnimation text={tagline} animationType='right' />
                </h6>
                <h3 className='sec-title__title bw-split-in-left d-flex gap-2'>
                  <TextAnimation text={title} animationType='left' />
                  <span>
                    <TextAnimation text={titleSpan} animationType='left' />
                  </span>
                </h3>
              </div>

              <TinySlider
                settings={{
                  items: 1,
                  gutter: 30,
                  loop: false,
                  nav: false,
                  autoplay: false,
                  controls: false,
                  mouseDrag: true,
                }}
                className='about-testimonials__carousel gotur-owl__carousel owl-carousel owl-theme wow fadeInUp'
              >
                {testimonials.map((testimonial, index) => (
                  <div className='about-testimonials__item' key={index}>
                    <div className='about-testimonials__star'>
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className='icon-star'></i>
                      ))}
                    </div>
                    <p className='about-testimonials__text'>
                      {testimonial.text}
                    </p>
                    <div className='about-testimonials__bottom'>
                      <div className='about-testimonials__author'>
                        <div className='about-testimonials__author__thumb'>
                          <Image
                            src={testimonial.image}
                            alt={`Author - ${testimonial.name}`}
                            width={80}
                            height={80}
                            style={{ borderRadius: "50%" }}
                          />
                        </div>
                        <div className='about-testimonials__content'>
                          <h6 className='about-testimonials__title'>
                            {testimonial.name}
                          </h6>
                          <span>{testimonial.role}</span>
                        </div>
                      </div>
                      <div className='about-testimonials__bottom__quite'>
                        <i className='icon-straight-quotes'></i>
                      </div>
                    </div>
                  </div>
                ))}
              </TinySlider>
            </div>
          </Col>
        </Row>
      </Container>
      <div className='about-testimonials__element-three'>
        <Image src={elementImage} alt='' />
      </div>
    </section>
  );
};

export default AboutTestimonialsTwo;
