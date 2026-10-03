"use client";
import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Image, { StaticImageData } from "next/image";
import dynamic from "next/dynamic";
import { sliderTowData } from "@/data/mainSliderTwoData";
import BannerForm from "../BannerForm/BannerForm";
const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});

interface SliderItem {
  id: number;
  backgroundImage: string;
  title: string;
  subtitle: string;
  text: string;
  imageElements: string[];
}

interface SliderData {
  tagline: string;
  title: string;
  titleSpan: string;
  buttonBg: string;
  sliderItems: SliderItem[];
}

const MainSliderTwo: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }
  const settings = {
    loop: true,
    autoplay: true,
    mode: "gallery",
    animateOut: "tns-fadeOut",
    animateIn: "tns-fadeIn",

    items: 1,
    gutter: 0,
    mouseDrag: true,
    preventScrollOnTouch: "auto",
    nav: false,
    autoplayButtonOutput: false,

    controlsContainer: ".owl-nav",
    // dots: true,
    autoplayTimeout: 6000,
    speed: 1000,
  };

  const { tagline, title, titleSpan, sliderItems }: SliderData = sliderTowData;
  console.log(sliderItems, "sliderItems");
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
    <section className='main-slider-two' id='home'>
      <div className='main-slider-two__carousel owl-carousel gotur-owl__carousel--basic-nav'>
        {mounted && (
          <TinySlider settings={settings}>
            {sliderItems?.map((sliderItem: SliderItem) => (
              <div key={sliderItem.id} className='item'>
                <div className='main-slider-two__item'>
                  <div
                    className='main-slider-two__bg'
                    style={{
                      backgroundImage: `url(${sliderItem.backgroundImage})`,
                    }}
                  ></div>
                  <div className='container'>
                    <div className='row'>
                      <div className='col-xl-8 col-lg-12'>
                        <div className='main-slider-two__content'>
                          <h5 className='main-slider-two__sub-title'>
                            {tagline}
                          </h5>
                          <h2 className='main-slider-two__title'>
                            {title} <br />
                            {titleSpan}
                            <span className='main-slider-two__title__overlay-group'>
                              <span className='main-slider-two__title__overlay'></span>
                              <span className='main-slider-two__title__overlay'></span>
                              <span className='main-slider-two__title__overlay'></span>
                              <span className='main-slider-two__title__overlay'></span>
                              <span className='main-slider-two__title__overlay'></span>
                              <span className='main-slider-two__title__overlay'></span>
                            </span>
                          </h2>
                          <p className='main-slider-two__text'>
                            {sliderItem.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {sliderItem.imageElements.map((image, idx) => (
                    <div
                      key={idx}
                      className={
                        idx === 0
                          ? "main-slider-two__element"
                          : `main-slider-two__element-${
                              numberWords[idx - 1] || idx
                            }`
                      }
                    >
                      <Image src={image} alt={`slider element ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TinySlider>
        )}
        <div className='owl-nav'>
          <button type='button' role='presentation' className='owl-prev'>
            <span className='icon-arrow-left'></span>
          </button>
          <button type='button' role='presentation' className='owl-next'>
            <span className='icon-arrow-right'></span>
          </button>
        </div>
      </div>

      <div className='main-slider-two__action-form'>
        <div className='container'>
          <div className='main-slider-two__form'>
            <BannerForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default MainSliderTwo;
