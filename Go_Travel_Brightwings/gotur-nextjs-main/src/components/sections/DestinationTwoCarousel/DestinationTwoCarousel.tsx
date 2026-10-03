"use client";
import React from "react";
import dynamic from "next/dynamic";
import Image, { StaticImageData } from "next/image";
import { Container } from "react-bootstrap";
import Link from "next/link";
import destinationsTwoGridData from "@/data/destinationTwoGridData";

const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});
interface Destination {
  title: string;
  image: string;
  link: string;
  colorClass: string;
  wowDelay: string;
}

const DestinationTwoCarousel: React.FC = () => {
  return (
    <section className='destination-two section-space'>
      <Container>
        <div className='destination-two__carousel gotur-owl__carousel gotur-owl__carousel--with-shadow gotur-owl__carousel--basic-nav owl-carousel owl-theme'>
          <TinySlider
            settings={{
              items: 1,
              gutter: 30,
              loop: false,
              nav: false,
              autoplay: false,
              controls: true,
              mouseDrag: true,
              controlsContainer: ".owl-nav",
              responsive: {
                0: { items: 1 },
                768: { items: 2 },
                992: { items: 3 },
              },
            }}
            className='destination-carousel__inner owl-carousel owl-theme'
          >
            {destinationsTwoGridData.map((item: Destination, index: number) => (
              <div className='item' key={index}>
                <div
                  className={`destination-card-two ${item.colorClass} wow fadeInUp`}
                  data-wow-duration='1500ms'
                  data-wow-delay={item.wowDelay}
                >
                  <div className='destination-card-two__thumb'>
                    <Image src={item.image} alt={item.title} />
                    <Link
                      href={item.link}
                      className='destination-card-two__overly'
                    ></Link>
                  </div>
                  <div className='destination-card-two__content'>
                    <h3 className='destination-card-two__title'>
                      <Link href={item.link}>{item.title}</Link>
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </TinySlider>
          <div className='owl-nav'>
            <button
              type='button'
              role='presentation'
              className='owl-prev disabled'
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
      </Container>
    </section>
  );
};

export default DestinationTwoCarousel;
