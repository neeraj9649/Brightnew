"use client";
import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { Col, Container, Row } from "react-bootstrap";
import aboutFiveTwoData from "@/data/aboutFiveTwo";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import Link from "next/link";

interface AboutData {
  title: string;
  tagline: string;
  description: string;
  features: {
    icon: string;
    title: string;
    text: string;
  }[];
  customerCount: number;
  videoLink: string;
  images: {
    mainImage: StaticImageData;
    smallImage: StaticImageData;
    elementThree: StaticImageData;
    elementFour: StaticImageData;
  };
}
const AboutFiveTwo: React.FC = () => {
  const [isOpen, setOpen] = useState(false);

  const {
    title,
    tagline,
    description,
    features,
    customerCount,
    videoLink,
    images,
  }: AboutData = aboutFiveTwoData;
  return (
    <>
      <section className='about-five about-five--two section-space' id='about'>
        <Container>
          <Row className='gutter-y-40 align-items-center'>
            <Col lg={6}>
              <div
                className='about-five__thumb wow fadeInLeft'
                data-wow-duration='1500ms'
                data-wow-delay='300ms'
              >
                <div className='about-five__thumb__item'>
                  <Image src={images.mainImage} alt='about-image' />
                </div>
                <div className='about-five__thumb__item-small'>
                  <Image src={images.smallImage} alt='about-small-image' />
                  <div className='about-five__thumb__item-video'>
                    <Link
                      className='video-popup'
                      href={videoLink}
                      onClick={(e) => {
                        e.preventDefault();
                        setOpen(true);
                      }}
                    >
                      <i className='fas fa-play'></i>
                      <i className='ripple'></i>
                    </Link>
                  </div>
                </div>
                <div className='about-five__thumb__text'>
                  {customerCount}+ Customer Worldwide
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className='about-five__right'>
                <div className='sec-title'>
                  <h6 className='sec-title__tagline bw-split-in-right'>
                    <TextAnimation text={tagline} animationType='right' />
                  </h6>
                  <h3 className='sec-title__title bw-split-in-left'>
                    <TextAnimation text={title} animationType='left' />
                  </h3>
                </div>
                <p
                  className='about-five__top__text wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay='300ms'
                >
                  {description}
                </p>
                <div className='about-five__feature'>
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className='about-five__feature__item wow fadeInUp'
                      data-wow-duration='1500ms'
                      data-wow-delay={`${300 + index * 100}ms`}
                    >
                      <div className='about-five__feature__content'>
                        <div className='about-five__feature__icon'>
                          <i className={feature.icon}></i>
                        </div>
                        <h4 className='about-five__feature__title'>
                          {feature.title}
                        </h4>
                      </div>
                      <p className='about-five__feature__text'>
                        {feature.text}
                      </p>
                    </div>
                  ))}
                </div>
                <div
                  className='about-five__button wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay='300ms'
                >
                  <Link
                    href='blog-details-left'
                    className='gotur-btn gotur-btn--primary'
                  >
                    Discover More{" "}
                    <span className='icon'>
                      <i className='icon-right'></i>
                    </span>
                  </Link>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
        <div className='about-five__element-three'>
          <Image src={images.elementThree} alt='shape-element-three' />
        </div>
        <div className='about-five__element-four'>
          <Image src={images.elementFour} alt='shape-element-four' />
        </div>
      </section>
      <VideoModal isOpen={isOpen} setOpen={setOpen} id={videoLink} />
    </>
  );
};

export default AboutFiveTwo;
