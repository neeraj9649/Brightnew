import testimonialsTwoData from "@/data/testimonialsTwoData";
import Image, { StaticImageData } from "next/image";
import React from "react";
import { Col, Container, Row } from "react-bootstrap";
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
const TestimonialsPage: React.FC = () => {
  const { testimonials }: TestimonialsData = testimonialsTwoData;
  return (
    <section className='testimonial-page section-space'>
      <Container>
        <Row className='gutter-y-30'>
          {testimonials.map((testimonial: Testimonial) => (
            <Col lg={6} md={6} key={testimonial.id}>
              <div
                className='testimonials-two-card testimonials-two-card--two  wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='00ms'
              >
                <div className='testimonials-two-card__inner'>
                  <div className='testimonials-two-card__top'>
                    <Image src={testimonial.image} alt='testiomonials author' />
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
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default TestimonialsPage;
