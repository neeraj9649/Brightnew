// AboutOne.tsx
import React from "react";

import Image, { StaticImageData } from "next/image";

import { Col, Container, Row } from "react-bootstrap";
import Link from "next/link";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { aboutOneThreeData } from "@/data/aboutOneThreeData";

// interfaces.ts
export interface Feature {
  icon: string;
  text: string;
}

export interface Mission {
  icon: string;
  title: string;
  text: string;
}

export interface Button {
  text: string;
  link: string;
  callIcon: string;
  callText: string;
  phone: string;
}

export interface AboutData {
  title: string;
  subtitle: string;
  description: string;
  features: Feature[];
  mission: Mission;
  button: Button;
  images: {
    mainImage: string;
    smallImage: string;
    shape1: string;
    shape2: string;
  };
}

const AboutOneThree: React.FC = () => {
  const {
    title,
    subtitle,
    description,
    features,
    mission,
    button,
    images,
  }: AboutData = aboutOneThreeData;

  return (
    <section className='about-one about-one--three section-space' id='about'>
      <Container>
        <Row className='gutter-y-40'>
          <Col lg={5}>
            <div
              className='about-one__thumb wow fadeInLeft animated'
              data-wow-duration='1500ms'
              data-wow-delay='300ms'
            >
              <div className='about-one__thumb__item'>
                <Image src={images.mainImage} alt='gotur image' />
              </div>
              <div className='about-one__thumb__item-small'>
                <Image src={images.smallImage} alt='gotur image' />
              </div>
              <div className='about-one__thumb__item-element'>
                <Image src={images.shape1} alt='gotur image' />
              </div>
            </div>
          </Col>
          <Col lg={7}>
            <div className='about-one__right'>
              <div className='sec-title'>
                <h6 className='sec-title__tagline bw-split-in-right'>
                  <TextAnimation text={subtitle} animationType='right' />
                </h6>
                <h3
                  className='sec-title__title bw-split-in-left'
                  style={{ maxWidth: "650px" }}
                >
                  <TextAnimation text={title} animationType='left' />
                  {/* <TextAnimation text={titleTwo} animationType='left' /> */}
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
                className='about-one__feature wow fadeInUp animated'
                data-wow-duration='1500ms'
                data-wow-delay='400ms'
              >
                <ul className='about-one__feature-list'>
                  {features.map((feature, index) => (
                    <li key={index}>
                      <i className='icon-check-star'></i> {feature.text}
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
                  href={button.link}
                  className='gotur-btn gotur-btn--primary'
                >
                  {button.text}{" "}
                  <span className='icon'>
                    <i className='icon-right'></i>
                  </span>
                </Link>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
      <div className='about-one__element-three'>
        <Image src={images.shape2} alt='element' />
      </div>
    </section>
  );
};

export default AboutOneThree;
