"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { StaticImageData } from "next/image";
import { mainSliderData } from "@/data/mainSliderThreeData";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import BannerForm from "../BannerForm/BannerForm";
import { Col, Container, Row } from "react-bootstrap";
import Link from "next/link";

// Define interfaces
interface SliderContent {
  id: number;
  title: string;
  tagLine: string;
  titleSpan: string;
  subtitle: string;
  text: string;
  thumbImage: string;
  videoId: string;
  buttonLink: string;
}
interface ImageElement {
  id: Number;
  image: string;
}

interface MainSliderData {
  buttonBg: string;
  sliderItems: SliderContent;
  elementTwo: string;
  imageElements: ImageElement[];
}

const MainSliderThree: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const { buttonBg, sliderItems, imageElements, elementTwo }: MainSliderData =
    mainSliderData;
  const {
    tagLine,
    title,
    titleSpan,
    subtitle,
    thumbImage,
    text,
    buttonLink,
    videoId,
  }: SliderContent = sliderItems;
  const numberWords = [
    "one",
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
    <>
      <section className='main-slider-three' id='home'>
        <Container>
          <Row className=' justify-content-start'>
            <Col xxl={6} lg={12}>
              <div className='main-slider-three__content'>
                <h5 className='main-slider-three__sub-title main-three bw-split-in-left'>
                  <TextAnimation text={tagLine} animationType='left' />
                </h5>
                <h2
                  className='main-slider-three__title main-three bw-split-in-left '
                  style={{ maxWidth: "760px" }}
                >
                  <TextAnimation text={title} animationType='left' />
                </h2>
                <div className='main-slider-three__text main-three bw-split-in-down'>
                  <TextAnimation text={text} animationType='down' />
                </div>
                <div className='main-slider-three__button'>
                  <Link
                    href={buttonLink}
                    className='gotur-btn gotur-btn--primary'
                  >
                    get in touch <i className='icon-paper-plane'></i>
                  </Link>
                  <div className='main-slider-three__item-video'>
                    <Link
                      className='video-popup'
                      href={videoId}
                      onClick={(e) => {
                        e.preventDefault();
                        setOpen(true);
                      }}
                    >
                      <i className='fas fa-play'></i>
                    </Link>
                    <span>play reel</span>
                  </div>
                </div>
              </div>
            </Col>
            <Col xxl={6}>
              <div className='main-slider-three__thumb'>
                <Image src={thumbImage} alt='thumb image' />
              </div>
            </Col>
          </Row>
        </Container>

        {/* Action Form Section */}
        <div className='main-slider-three__action-form'>
          <div className='container'>
            <div className='main-slider-three__form'>
              <BannerForm />
            </div>
          </div>
        </div>

        <div className='main-slider-three__element'>
          {imageElements.map((image: ImageElement, idx) => (
            <div
              key={idx}
              className={
                idx === 0
                  ? "main-slider-three__element__item"
                  : `main-slider-three__element__item-${
                      numberWords[idx - 1] || idx
                    }`
              }
            >
              <Image src={image.image} alt={`slider element ${idx + 1}`} />
            </div>
          ))}
        </div>
        <div className='main-slider-three__element-two'>
          <Image src={elementTwo} alt='element' />
        </div>
        <div className='main-slider-three__element-three'>
          <span className='main-slider-three__element-three-item'></span>
          <span className='main-slider-three__element-three-item'></span>
          <span className='main-slider-three__element-three-item'></span>
        </div>
      </section>
      <VideoModal isOpen={isOpen} setOpen={setOpen} id={videoId} />
    </>
  );
};

export default MainSliderThree;
