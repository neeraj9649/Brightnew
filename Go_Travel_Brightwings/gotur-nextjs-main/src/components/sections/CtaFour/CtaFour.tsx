import React from "react";

import Image, { StaticImageData } from "next/image"; // Import Image from next/image
import { Container, Row, Col } from "react-bootstrap";
import { ctaFourData } from "@/data/ctaFourData";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import Link from "next/link";
interface CtaData {
  tagline: string;
  title: string;
  buttonText: string;
  buttonLink: string;
  backgroundImage: string;
  images: string[];
}
const CtaFour: React.FC = () => {
  const {
    tagline,
    title,
    buttonText,
    buttonLink,
    backgroundImage,
    images,
  }: CtaData = ctaFourData;
  const numberWords = [
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
  ];
  return (
    <section className='cta-four'>
      <div
        className='cta-four__bg'
        style={{ backgroundImage: `url(${backgroundImage})` }}
      ></div>
      <Container fluid>
        <div className='cta-four__inner'>
          <Row>
            <Col lg={6}>
              <div className='cta-four__content'>
                <div className='sec-title'>
                  <h6 className='sec-title__tagline bw-split-in-right'>
                    <TextAnimation text={tagline} animationType='right' />
                  </h6>
                  <h3
                    className='sec-title__title bw-split-in-left'
                    style={{ maxWidth: "600px" }}
                  >
                    <TextAnimation text={title} animationType='left' />
                  </h3>
                </div>
                <div
                  className='cta-four__content__btn wow fadeInLeft'
                  data-wow-duration='1500ms'
                  data-wow-delay='400ms'
                >
                  <Link
                    href={buttonLink}
                    className='gotur-btn gotur-btn--white'
                  >
                    {buttonText}{" "}
                    <span className='icon'>
                      <i className='icon-right'></i>
                    </span>
                  </Link>
                </div>
              </div>
            </Col>
          </Row>
          {images.map((image, index) => (
            <div
              key={index}
              className={
                index === 0
                  ? "cta-four__thumb__item wow pulse"
                  : `wow pulse cta-four__thumb__item-${
                      numberWords[index - 1] || index
                    }`
              }
              data-wow-duration='1500ms'
              data-wow-delay='700ms'
            >
              <Image src={image} alt={`cta-image-${index}`} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default CtaFour;
