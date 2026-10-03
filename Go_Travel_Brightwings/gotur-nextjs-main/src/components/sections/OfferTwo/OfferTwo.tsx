"use client";
import React from "react";

import { Row, Col } from "react-bootstrap";
import Image, { StaticImageData } from "next/image";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

import Link from "next/link";
import { offerTwoData } from "@/data/offerTwoData";
import ReactCurvedText from "react-curved-text";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";

interface OfferData {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  count: number;
  tagline: string;
  funfactText: string;
  upToText: string;
  image: string;
  shapes: {
    shape1: string;
    bgShape: string;
    aboutShape: string;
    planShape: string;
  };
}

const OfferTwo = () => {
  const {
    title,
    subtitle,
    buttonText,
    buttonLink,
    count,
    tagline,
    funfactText,
    upToText,
    image,
    shapes,
  }: OfferData = offerTwoData;

  // Using IntersectionObserver to trigger animations when the section comes into view
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.5,
  });

  return (
    <section className='offer-two section-space-bottom' ref={ref}>
      <div className='container'>
        <div className='offer-two__inner'>
          <Row>
            <Col lg={8} xl={6}>
              <div className='offer-two__content'>
                <div className='sec-title text-start'>
                  <h6 className='sec-title__tagline bw-split-in-right'>
                    <TextAnimation text={tagline} animationType='right' />
                  </h6>{" "}
                  <h3 className='sec-title__title bw-split-in-left'>
                    <TextAnimation text={title} animationType='left' />
                    <span>
                      <TextAnimation text={subtitle} animationType='left' />
                    </span>
                  </h3>
                </div>
                <div
                  className='offer-two__btn wow fadeInUp'
                  data-wow-delay='0.2s'
                  data-wow-duration='1500ms'
                >
                  <Link href={buttonLink} className='gotur-btn'>
                    {buttonText}{" "}
                    <span className='icon'>
                      <i className='icon-right'></i>
                    </span>
                  </Link>
                </div>
              </div>
            </Col>
          </Row>

          <div
            className='offer-two__thumb wow fadeInLeft'
            data-wow-duration='1500ms'
            data-wow-delay='400ms'
          >
            <div className='offer-two__thumb__item offer-two__thumb__item'>
              <img src={image} alt='offer image' />
            </div>
            <div className='offer-two__thumb__element'></div>
          </div>

          <div className='offer-two__funfact'>
            <div className='offer-two__funfact__item'>
              <div className='offer-two__funfact__item__inner count-box'>
                <h2 className='offer-two__funfact__item__count'>
                  <span className='count-text'>
                    {inView && <CountUp start={0} end={count} duration={2} />}
                  </span>
                  <span>%</span>
                </h2>
                <p className='offer-two__funfact__item__text'>{funfactText}</p>{" "}
                <span className='offer-two__funfact__item__upto'>
                  {upToText}
                </span>{" "}
                <div className='offer-two__funfact__item__shape'>
                  <img src={shapes.shape1} alt='shape' />
                </div>
              </div>
            </div>
            <div className='offer-two__funfact__cercle'>
              <div className='offer-two__funfact__cercle__inner curved-circle__item'>
                <ReactCurvedText
                  text='new year sales'
                  cx={180}
                  cy={200}
                  rx={120}
                  ry={130}
                  radius={197}
                  fontSize={20}
                  fontWeight={500}
                  fill='#fff'
                  reversed={true}
                  width={500}
                  height={300}
                  tspanProps={{ dy: "-20" }}
                />
              </div>
            </div>
          </div>

          <div className='offer-two__element'>
            <img src={shapes.bgShape} alt='background shape' />
          </div>
          <div className='offer-two__element-two'>
            <img src={shapes.aboutShape} alt='about shape' />
          </div>
          <div className='offer-two__element-three'>
            <img src={shapes.planShape} alt='plan shape' />
          </div>
        </div>
      </div>
    </section>
  );
};

export default OfferTwo;
