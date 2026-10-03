"use client";
import React from "react";
import { aboutOneTwoData, images } from "@/data/aboutOneTwoData";
import Image from "next/image"; // Import the Image component from Next.js
import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";
import { Col, Container, Row } from "react-bootstrap";
import Link from "next/link";
interface AboutOneTwoData {
  title: string;
  subTitle: string;
  description: string;
  features: string[];
  satisfiedTravelers: number;
}
const AboutOneTwo: React.FC = () => {
  const {
    title,
    subTitle,
    description,
    features,
    satisfiedTravelers,
  }: AboutOneTwoData = aboutOneTwoData;

  const { ref, inView } = useInView({
    threshold: 1.0,
    triggerOnce: false,
  });

  return (
    <section className='about-one section-space about-one--two'>
      <Container>
        <Row className=' gutter-y-40'>
          {/* Left Column with Images */}
          <Col lg={6}>
            <div
              className='about-one__thumb wow fadeInLeft'
              data-wow-duration='1500ms'
              data-wow-delay='300ms'
            >
              <div className='about-one__thumb__item'>
                <Image src={images.mainImage} alt='about image' />
              </div>
              <div className='about-one__thumb__item-small'>
                <Image src={images.smallImage} alt='about small image' />
              </div>
              <div className='about-one__thumb__funfact'>
                <div className='about-one__thumb__funfact__icon'>
                  <i className='icon-icon-4'></i>
                </div>
                <div
                  className='about-one__thumb__funfact__content count-box'
                  ref={ref}
                >
                  <h2 className='about-one__thumb__funfact__count'>
                    {inView && (
                      <CountUp
                        start={0}
                        end={satisfiedTravelers}
                        duration={2}
                      />
                    )}
                    <span>+</span>
                  </h2>
                  <p className='about-one__thumb__funfact__text'>
                    Satisfied Travelers
                  </p>
                </div>
              </div>
            </div>
          </Col>

          {/* Right Column with Content */}
          <Col lg={6}>
            <div className='about-one__right'>
              <div className='sec-title'>
                <h6 className='sec-title__tagline bw-split-in-right'>
                  {title}
                </h6>
                <h3 className='sec-title__title bw-split-in-left'>
                  {subTitle}
                </h3>
              </div>
              <p
                className='about-one__top__text wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='300ms'
              >
                {description}
              </p>
              <div
                className='about-one__feature wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='300ms'
              >
                <ul className='about-one__feature-list'>
                  {features.map((feature, index) => (
                    <li key={index}>
                      <i className='icon-mark-1'></i> {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className='about-one__button wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='300ms'
              >
                <Link
                  href='blog-details-left'
                  className='gotur-btn gotur-btn--base'
                >
                  Discover More{" "}
                  <span className='icon'>
                    <i className='icon-right'></i>
                  </span>
                </Link>
                <div className='about-one__button__call'>
                  <div className='about-one__button__call__icon'>
                    <i className='icon-telephone'></i>
                  </div>
                  <div className='about-one__button__call__content'>
                    <span>Call Us Now</span>
                    <Link href='tel:+208-555-0112'>+208-555-0112</Link>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
      <div className='about-one__element-two'>
        <Image src={images.elementImage} alt='about element image' />
      </div>
    </section>
  );
};

export default AboutOneTwo;
