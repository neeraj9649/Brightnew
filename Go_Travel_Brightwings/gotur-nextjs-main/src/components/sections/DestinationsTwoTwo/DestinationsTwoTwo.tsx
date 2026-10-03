"use client";

import Image, { StaticImageData } from "next/image";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import Link from "next/link";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import destinationsTwoTwoData from "@/data/destinationsTwoTwoData";
const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});

interface Destination {
  title: string;
  link: string;
  image: string;
  hoverImage: string;
}

interface DestinationsTwo {
  tagline: string;
  title: string;
  highlighted: string;
  elementImage: string;
  destinations: Destination[];
}

const DestinationsTwoTwo = () => {
  const {
    tagline,
    title,
    highlighted,
    destinations,
    elementImage,
  }: DestinationsTwo = destinationsTwoTwoData;

  const carouselOptions = {
    items: 1,
    gutter: 30,
    loop: true,
    smartSpeed: 700,
    controls: true,
    controlsContainer: ".destinations-two__bottom__nav",
    nav: false,
    autoplay: false,
    responsive: {
      0: { items: 1 },
      575: { items: 2 },
      768: { items: 3 },
      992: { items: 3 },
      1199: { items: 4 },
    },
  };

  return (
    <section
      className='destinations-two destinations-two--two section-space'
      id='destination'
    >
      <Container>
        <div className='destinations-two__top'>
          <Row className='align-items-end'>
            <Col lg={8}>
              <div className='sec-title'>
                <h6 className='sec-title__tagline'>
                  <TextAnimation text={tagline} animationType='right' />
                </h6>
                <h3 className='sec-title__title d-md-flex gap-2'>
                  <TextAnimation text={title} animationType='left' />
                  <span>
                    <TextAnimation text={highlighted} animationType='left' />
                  </span>
                </h3>
              </div>
            </Col>
            <Col lg={4}>
              <div className='destinations-two__bottom__nav'>
                <button className='destinations-two__carousel__nav--left'>
                  <span className='icon-arrow-left'></span>
                </button>
                <button className='destinations-two__carousel__nav--right'>
                  <span className='icon-arrow-right'></span>
                </button>
              </div>
            </Col>
          </Row>
        </div>
      </Container>

      <div className='container-fluid'>
        <div className='destinations-two__inner'>
          <TinySlider
            className='destinations-two__carousel gotur-owl__carousel gotur-owl__carousel--custom-nav gotur-owl__carousel--with-shadow owl-carousel owl-theme owl-loaded owl-drag'
            settings={carouselOptions}
          >
            {destinations.map((dest: Destination, index) => (
              <div key={index}>
                <div className='item'>
                  <div
                    className='destinations-card-two wow fadeInUp'
                    data-wow-duration='1500ms'
                    data-wow-delay='100ms'
                  >
                    <div className='destinations-card-two__thumb'>
                      <Image
                        src={dest.image}
                        alt={dest.title}
                        className='img-fluid'
                      />
                      <div className='destinations-card-two__hover'>
                        <Image
                          src={dest.hoverImage}
                          alt={dest.title}
                          className='img-fluid'
                        />
                      </div>
                    </div>
                    <h4 className='destinations-card-two__title'>
                      <Link href={dest.link}>{dest.title}</Link>
                    </h4>
                  </div>
                </div>
              </div>
            ))}
          </TinySlider>
        </div>
      </div>

      <div className='destinations-two__element'>
        <Image src={elementImage} alt='' />
      </div>
    </section>
  );
};

export default DestinationsTwoTwo;
