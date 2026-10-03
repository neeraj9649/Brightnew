"use client";
import React, { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Image from "next/image";
import { destinationsThreeData } from "@/data/destinationsThreeData"; // Corrected data import
import { Autoplay, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperType } from "swiper/types";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";

// Import Swiper styles
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

// Import StaticImageData from next/image
// import { StaticImageData } from "next/image";
import Link from "next/link";

// Define types for StaticImageData used in the images
interface Destination {
  id: string;
  name: string;
  tours: number;
  hotels: number;
  images: string[];
  thumbnails: string[];
}



interface DestinationsData {
  tagline: string;
  title: string;
  titleSpan: string;
  buttonBg: string;
  destinations: Destination[];
  element: string;
  shape: string;
}

const DestinationThree: React.FC = () => {
  const {
    tagline,
    title,
    titleSpan,
    buttonBg,
    destinations,
    element,
    shape,
  }: DestinationsData = destinationsThreeData;

  const [activeTab, setActiveTab] = useState<string>(destinations[0].id); // Set default active tab
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  const handleTabClick = (id: string) => {
    setActiveTab(id);
  };

  return (
    <section className='destination-three section-space' id='trending'>
      <Container>
        <div className='sec-title text-center'>
          <h6 className='sec-title__tagline bw-split-in-right'>
            <TextAnimation text={tagline} animationType='right' />
          </h6>
          <h3 className='sec-title__title bw-split-in-left d-flex gap-2 justify-content-center'>
            <TextAnimation text={title} animationType='left' />
            <span>
              <TextAnimation text={titleSpan} animationType='left' />
            </span>
          </h3>
        </div>

        <div className='tabs-box'>
          <Row>
            <Col lg={4}>
              <div className='destination-three__left tab-buttons'>
                <ul className='destination-three__list list-unstyled'>
                  {destinations.map((destination) => (
                    <li
                      key={destination.id}
                      className={`destination-three__list__item tab-btn ${
                        activeTab === destination.id ? "active-btn" : ""
                      }`}
                      onClick={() => handleTabClick(destination.id)}
                    >
                      {destination.name}
                      <span className='destination-three__list__item__hover-one'>
                        <span></span>
                        <span></span>
                      </span>
                      <span className='destination-three__list__item__hover-two'>
                        <span></span>
                        <span></span>
                      </span>
                    </li>
                  ))}
                </ul>
                <div
                  className='destination-three__button'
                  style={{
                    backgroundImage: `url(${buttonBg})`,
                  }}
                >
                  <Link
                    href='tour-listing-details-1'
                    className='gotur-btn gotur-btn--primary'
                  >
                    Start Booking{" "}
                    <span className='icon'>
                      <i className='icon-right'></i>
                    </span>
                  </Link>
                </div>
              </div>
            </Col>

            <Col lg={8}>
              <div className='tabs-content'>
                {destinations.map((destination) =>
                  activeTab === destination.id ? (
                    <div
                      key={destination.id}
                      className='item tab active-tab fadeInUp animated'
                      id={destination.id}
                    >
                      <div className='tabs-content__inner'>
                        {/* Main Swiper */}
                        <div className='destination-three__carousel carousel slide'>
                          <Swiper
                            spaceBetween={10}
                            autoplay={{
                              delay: 5000,
                              disableOnInteraction: false,
                            }}
                            thumbs={{ swiper: thumbsSwiper }}
                            modules={[Autoplay, Thumbs]}
                            className='carousel-inner'
                          >
                            {destination.images.map((image, index) => (
                              <SwiperSlide key={index}>
                                <div className='destination-three__carousel__item__inner'>
                                  <Image
                                    src={image}
                                    alt={`Destination image ${
                                      destination.name
                                    } ${index + 1}`}
                                    width={800}
                                    height={500}
                                    style={{ width: "100%", height: "auto" }}
                                  />
                                  <div className='destination-three__carousel__item__group'>
                                    <p className='destination-three__carousel__item__text'>
                                      {destination.tours} Tour+
                                    </p>
                                    <p className='destination-three__carousel__item__text'>
                                      {destination.hotels} Hotels
                                    </p>
                                  </div>
                                  <Link
                                    href='destination-details'
                                    className='destination-three__carousel__item__btn'
                                  >
                                    <i className='icon-right'></i>
                                  </Link>
                                </div>
                              </SwiperSlide>
                            ))}
                          </Swiper>

                          {/* Thumbs Swiper */}
                          <div className='destination-three__carousel__thumb thumbnail-container'>
                            <Swiper
                              onSwiper={setThumbsSwiper}
                              spaceBetween={20}
                              slidesPerView={4}
                              watchSlidesProgress
                              modules={[Thumbs]}
                            >
                              {destination.thumbnails.map((thumb, index) => (
                                <SwiperSlide
                                  key={index}
                                  className='destination-three__carousel__thumb__item'
                                >
                                  <Image
                                    src={thumb}
                                    alt={`Thumbnail for ${destination.name} ${
                                      index + 1
                                    }`}
                                    width={200}
                                    height={120}
                                    style={{ width: "100%", height: "auto" }}
                                  />
                                </SwiperSlide>
                              ))}
                            </Swiper>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </Col>
          </Row>
        </div>
      </Container>
      <div className='destination-three__element'>
        <Image src={shape} alt='' width={100} height={100} />
      </div>
      <div className='destination-three__element-two'>
        <Image src={element} alt='' width={100} height={100} />
      </div>
    </section>
  );
};

export default DestinationThree;
