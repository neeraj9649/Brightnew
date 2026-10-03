// AboutOne.tsx
import React from "react";

import Image, { StaticImageData } from "next/image"; // Next.js Image component for optimized static images
import { aboutOneData } from "@/data/aboutOne";
import { Col, Container, Row } from "react-bootstrap";
import Link from "next/link";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import TeamPage from "../TeamPage/TeamPage";

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
    popupImage: string;
    shape1: string;
    shape2: string;
  };
}
interface AboutOneProps {
  extraclass?: string;
}

const AboutOne: React.FC<AboutOneProps> = ({ extraclass }) => {
  const {
    title,
    subtitle,
    description,
    features,
    mission,
    button,
    images,
  }: AboutData = aboutOneData;

  return (
    <section className={`about-one section-space ${extraclass}`} id='about'>
      <Container>
        <Row className='gutter-y-40'>
          <Col lg={6}>
            <div
              className='about-one__thumb wow fadeInLeft'
              data-wow-duration='1500ms'
              data-wow-delay='300ms'
            >
              <div className='about-one__thumb__item'>
                <Image src={images.mainImage} alt='gotur image' width={134} height={143}/>
              </div>
              <div className='about-one__thumb__item-small'>
                <Image src={images.smallImage} alt='gotur image'width={234} height={143}/>
              </div>
              <div className='about-one__thumb__item-popup'>
                <Image src={images.popupImage} alt='gotur image'width={134} height={143}/>
              </div>
            </div>
          </Col>
          <Col lg={6}>
            <div className='about-one__right'>
              <div className='sec-title'>
                <h6 className='sec-title__tagline bw-split-in-right'>
                  <TextAnimation text={subtitle} animationType='right' />
                </h6>
                <h3
                  className='sec-title__title bw-split-in-left'
                  style={{ maxWidth: "555px" }}
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
              <div className='about-one__feature'>
                <Row className='gutter-y-20'>
                  <Col
                    xl={6}
                    lg={12}
                    md={6}
                    className='wow fadeInUp'
                    data-wow-duration='1500ms'
                    data-wow-delay='300ms'
                  >
                    <ul className='about-one__feature-list'>
                      {features.map((feature, index) => (
                        <li key={index}>
                          <i className='icon-check-star'></i> {feature.text}
                        </li>
                      ))}
                    </ul>
                  </Col>

                  <Col
                    xl={6}
                    lg={12}
                    md={6}
                    className='wow fadeInUp'
                    data-wow-duration='1500ms'
                    data-wow-delay='400ms'
                  >
                    <div className='about-one__feature-vestion'>
                      <div className='about-one__feature_icon'>
                        <i className={mission.icon}></i>
                      </div>
                      <div className='about-one__feature-content'>
                        <h5 className='about-one__feature-title'>
                          {mission.title}
                        </h5>
                        <p className='about-one__feature-text'>
                          {mission.text}
                        </p>
                      </div>
                    </div>
                  </Col>
                </Row>
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
                <div className='about-one__button__call'>
                  <div className='about-one__button__call__icon'>
                    <i className={button.callIcon}></i>
                  </div>
                  <div className='about-one__button__call__content'>
                    <span>{button.callText}</span>
                    <Link href={`tel:${button.phone}`}>{button.phone}</Link>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
      <TeamPage/>
      <div className='about-one__element-one'>
        <Image src={images.shape1} alt='element' width={164} height={143}/>
      </div>
      <div className='about-one__element-two'>
        <Image src={images.shape2} alt='element'width={164} height={143}/>
      </div>
    </section>
  );
};

export default AboutOne;
