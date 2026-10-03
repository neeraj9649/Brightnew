"use client";
import React from "react";
import dynamic from "next/dynamic";
import destinationOneData from "@/data/destinationOneData";
import Image, { StaticImageData } from "next/image";
import { Container } from "react-bootstrap";
import Link from "next/link";

const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});
interface DestinationItem {
  name: string;
  image: string;
  link: string;
}

const DestinationOneCarousel: React.FC = () => {
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
            {destinationOneData.map(
              (destination: DestinationItem, index: number) => (
                <div className='item' key={index}>
                  <div
                    className='destination-card-one wow fadeInUp'
                    data-wow-duration='1500ms'
                    data-wow-delay={`${(index + 1) * 100}ms`}
                  >
                    <div className='destination-card-one__thumb'>
                      <Image src={destination.image} alt='destination' />
                      <Link
                        href=''
                        className='destination-card-one__overly'
                      ></Link>
                    </div>
                    <div className='destination-card-one__content'>
                      <h3 className='destination-card-one__title'>
                        <Link href={destination.link}>{destination.name}</Link>
                      </h3>
                    </div>
                  </div>
                </div>
              )
            )}
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

export default DestinationOneCarousel;
