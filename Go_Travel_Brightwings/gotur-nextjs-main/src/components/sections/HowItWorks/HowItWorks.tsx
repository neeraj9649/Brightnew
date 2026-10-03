import React from "react";

import Image from "next/image";
import { Container, Row, Col } from "react-bootstrap";
import { howItWorksData } from "@/data/howItWorksData";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
interface HowItWorksData {
  sectionTitle: string;
  sectionTagline: string;
  steps: {
    icon: string;
    title: string;
    description: string;
  }[];
  shapeImage: string;
  laggesImage: string;
}
const HowItWorks: React.FC = () => {
  const {
    sectionTagline,
    sectionTitle,
    steps,
    shapeImage,
    laggesImage,
  }: HowItWorksData = howItWorksData;
  return (
    <section className='how-to-work section-space'>
      <div className='container'>
        <div className='sec-title text-center'>
          <h6 className='sec-title__tagline bw-split-in-right'>
            <TextAnimation text={sectionTagline} animationType='right' />
          </h6>
          <h3 className='sec-title__title bw-split-in-left  d-flex justify-content-center'>
            <TextAnimation text={sectionTitle} animationType='left' />
          </h3>
        </div>
        <div className='row gutter-y-40'>
          {steps.map((step, index) => (
            <Col lg={4} md={6} key={index}>
              <div
                className='how-to-work__item wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay={`${300 + index * 200}ms`}
              >
                <div className='how-to-work__icon'>
                  <i className={step.icon}></i>
                  <span className='how-to-work__icon__count'></span>
                </div>
                <h4 className='how-to-work__title'>{step.title}</h4>
                <p className='how-to-work__text'>{step.description}</p>
              </div>
            </Col>
          ))}
        </div>
        <div className='how-to-work__shape'>
          <Image src={shapeImage} alt='shape-image' width={9000} height={100} />
        </div>
      </div>
      <div className='how-to-work__element'>
        <Image src={laggesImage} alt='how-lagges' width={200} height={100} />
      </div>
    </section>
  );
};

export default HowItWorks;
