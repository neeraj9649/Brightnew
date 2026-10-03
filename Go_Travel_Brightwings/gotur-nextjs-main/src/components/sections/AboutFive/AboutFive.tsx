"use client";
import Image from "next/image";
import React, { useState } from "react";
import { aboutFiveData, AboutFiveFeature } from "@/data/aboutFiveData";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import { Col, Container, Row } from "react-bootstrap";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import Link from "next/link";

const AboutFive: React.FC = () => {
  const [isOpen, setOpen] = useState(false);
  const {
    sectionTagline,
    sectionTitle,
    sectionHighlight,
    sectionLast,
    description,
    videoUrl,
    mainImage,
    smallImage,
    shapeOverlay,
    shapeOne,
    shapeTwo,
    features,
    buttonText,
    buttonUrl,
    authorImage,
    authorName,
    authorRole,
  } = aboutFiveData;

  return (
    <>
      <section className='about-five section-space' id='about'>
        <Container>
          <Row className=' gutter-y-40 align-items-center'>
            <Col lg={5}>
              <div
                className='about-five__thumb wow fadeInLeft'
                data-wow-duration='1500ms'
                data-wow-delay='300ms'
              >
                <div className='about-five__thumb__item'>
                  <Image src={mainImage} alt='thumb item' />
                </div>
                <div className='about-five__thumb__item-small'>
                  <Image src={smallImage} alt='small thumb item' />
                </div>
                <div className='about-five__thumb__item-video'>
                  <Link
                    className='video-popup'
                    href={videoUrl}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(true);
                    }}
                  >
                    <i className='fas fa-play'></i>
                    <i className='ripple'></i>
                  </Link>
                </div>
                <div className='about-five__thumb__item-element'>
                  <Image src={shapeOverlay} alt='shape overlay' />
                </div>
              </div>
            </Col>
            <Col lg={7}>
              <div className='about-five__right'>
                <div className='sec-title'>
                  <h6 className='sec-title__tagline bw-split-in-right'>
                    <TextAnimation
                      text={sectionTagline}
                      animationType='right'
                    />
                  </h6>
                  <h3 className='sec-title__title bw-split-in-left'>
                    <TextAnimation text={sectionTitle} animationType='left' />
                    <div className='d-flex gap-2'>
                      <span>
                        <TextAnimation
                          text={sectionHighlight}
                          animationType='left'
                        />
                      </span>
                      <TextAnimation text={sectionLast} animationType='left' />
                    </div>
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
                  {features.map((feature: AboutFiveFeature, index) => (
                    <div
                      key={index}
                      className='about-five__feature__item wow fadeInUp'
                      data-wow-duration='1500ms'
                      data-wow-delay={feature.delay}
                    >
                      <div className='about-five__feature__icon'>
                        <i className={feature.icon}></i>
                      </div>
                      <div className='about-five__feature__content'>
                        <h4 className='about-five__feature__title'>
                          {feature.title}
                        </h4>
                        <p className='about-five__feature__text'>
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className='about-two__button wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay='300ms'
                >
                  <Link
                    href={buttonUrl}
                    className='gotur-btn gotur-btn--primary'
                  >
                    {buttonText}{" "}
                    <span className='icon'>
                      <i className='icon-right'></i>
                    </span>
                  </Link>
                  <div className='about-two__button__author'>
                    <div className='about-two__button__author__thumb'>
                      <Image
                        src={authorImage}
                        alt='author'
                        className='img-fluid'
                      />
                    </div>
                    <div className='about-two__button__author__content'>
                      <h5 className='about-two__button__author__name'>
                        {authorName}
                      </h5>
                      <span className='about-two__button__author__dec'>
                        {authorRole}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>

        <div className='about-five__element-one'>
          <Image src={shapeOne} alt='shape 1' />
        </div>
        <div className='about-five__element-two'>
          <Image src={shapeTwo} alt='shape 2' />
        </div>
      </section>
      <VideoModal isOpen={isOpen} setOpen={setOpen} id={videoUrl} />
    </>
  );
};

export default AboutFive;
