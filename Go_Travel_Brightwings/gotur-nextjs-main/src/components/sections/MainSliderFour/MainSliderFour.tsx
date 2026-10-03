"use client";
import React from "react";

import Image, { StaticImageData } from "next/image"; // Import next/image for image optimization
import dynamic from "next/dynamic";
import mainSliderFourData from "@/data/mainSliderFourData";
import { Container } from "react-bootstrap";
import BannerForm from "../BannerForm/BannerForm";

const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});

interface SliderItem {
  id: number;
  subtitle: string;
  title: string;
  titleSpan: string;
  titleEnd: string;
  imageSrc: string;
  imageAlt: string;
  lineShape: string;
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

const MainSliderFour: React.FC = () => {
  return (
    <section className='main-slider-four' id='home'>
      <div className='main-slider-four__carousel gotur-owl__carousel owl-carousel'>
        <TinySlider settings={settings}>
          {mainSliderFourData?.map((item: SliderItem) => (
            <div key={item.id}>
              <div className='item'>
                <div className='main-slider-four__item'>
                  <div
                    className='main-slider-four__bg'
                    style={{
                      backgroundImage: `url(${item.imageSrc})`,
                    }}
                  ></div>
                  <div className='container'>
                    <div className='main-slider-four__content'>
                      <h5 className='main-slider-four__subtitle'>
                        {item.subtitle}
                      </h5>
                      <h2 className='main-slider-four__title'>
                        {item.title}
                        <span>
                          {item.titleSpan}
                          <Image src={item.lineShape} alt='line' />
                        </span>
                        {item.titleEnd}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </TinySlider>
        <div className='owl-nav'>
          <button
            type='button'
            role='presentation'
            className='owl-prev'
            aria-label='carousel button'
          >
            <span className='icon-arrow-left'></span>
          </button>
          <button
            type='button'
            role='presentation'
            className='owl-next'
            aria-label='carousel button'
          >
            <span className='icon-arrow-right'></span>
          </button>
        </div>
      </div>
      <div className='main-slider-four__action-form'>
        <Container>
          <div className='main-slider-four__form'>
            <BannerForm />
          </div>
        </Container>
      </div>
    </section>
  );
};

export default MainSliderFour;
