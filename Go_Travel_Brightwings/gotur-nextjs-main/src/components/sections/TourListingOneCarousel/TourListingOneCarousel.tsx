"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Container } from "react-bootstrap";
import Image, { StaticImageData } from "next/image";
import { tourListingOneLeftData } from "@/data/tourListingOneLeftData";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import Link from "next/link";

const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});
interface Metadata {
  id: number;
  title: string;
  icon: string;
}
interface TourListingData {
  locations: { label: string; value: string }[];
  activities: { label: string; value: string }[];
  dateRangePlaceholder: string;
  travelerCount: number;
  icons: {
    location: string;
    activity: string;
    calendar: string;
    group: string;
  };

  items: {
    id: number;
    image: string;
    title: string;
    link: string;
    price: string;
    rating: number;
    reviews: number;
    videoId: string;
    discount: string;
    meta: Metadata[];
  }[];
}
const TourListingOneCarousel: React.FC = () => {
  const { items }: TourListingData = tourListingOneLeftData;
  const [isOpen, setOpen] = useState(false);
  const [videoId, setVideoId] = useState("");
  return (
    <>
      <section className='blog-page section-space'>
        <Container>
          <PhotoSwipeGallery>
            <div className='blog-page__carousel gotur-owl__carousel gotur-owl__carousel--with-shadow gotur-owl__carousel--basic-nav owl-carousel owl-theme owl-loaded owl-drag'>
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
                    0: {
                      items: 1,
                    },
                    768: {
                      items: 2,
                    },
                    992: {
                      items: 3,
                    },
                  },
                }}
              >
                {items.map((item) => (
                  <div className='item' key={item.id}>
                    <div
                      className='listing-card-four wow fadeInUp'
                      data-wow-duration='1500ms'
                    >
                      <div className='listing-card-four__image'>
                        <Image src={item.image} alt={item.title} />
                        <div className='listing-card-four__btn-group'>
                          {item.discount && (
                            <div className='listing-card-four__discount'>
                              -{item.discount}% off
                            </div>
                          )}
                          <div className='listing-card-four__featured'>
                            Featured
                          </div>
                        </div>
                        <div className='listing-card-four__btns'>
                          <Link href='#'>
                            <i className='far fa-heart'></i>
                          </Link>
                          <div className='listing-card-four__btns__hover'>
                            <Item
                              original={item.image}
                              thumbnail={item.image}
                              width='370'
                              height='257'
                            >
                              {({ ref, open }) => (
                                <Link
                                  href='#'
                                  className='listing-card-four__popup card__popup'
                                  ref={ref}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    open(e);
                                  }}
                                >
                                  <span className='icon-image'></span>
                                </Link>
                              )}
                            </Item>

                            <Link
                              className='video-popup'
                              href='https://www.youtube.com/watch?v=0MuL8fd3pb8'
                              onClick={(e) => {
                                e.preventDefault();
                                setOpen(true);
                                setVideoId(item.videoId);
                              }}
                            >
                              <span className='icon-video'></span>
                            </Link>
                          </div>
                        </div>
                        <ul className='listing-card-four__meta list-unstyled'>
                          {item.meta.map((meta: Metadata) => (
                            <li key={meta.id}>
                              <Link href='tour-listing-details-2'>
                                {" "}
                                <span className='listing-card-four__meta__icon'>
                                  {" "}
                                  <i className={meta.icon}></i>{" "}
                                </span>
                                {meta.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className='listing-card-four__content'>
                        <div className='listing-card-four__rating'>
                          <span>({item.reviews} Review)</span>
                          {[...Array(item.rating)].map((_, i) => (
                            <i key={i} className='icon-star'></i>
                          ))}
                        </div>
                        <h3 className='listing-card-four__title'>
                          <Link href={item.link}>{item.title}</Link>
                        </h3>

                        <div className='listing-card-four__content__btn'>
                          <div className='listing-card-four__price'>
                            <span className='listing-card-four__price__sub'>
                              Per Day
                            </span>
                            <span className='listing-card-four__price__number'>
                              {item.price}
                            </span>
                          </div>
                          <Link
                            href={item.link}
                            className='listing-card-four__btn gotur-btn'
                          >
                            Book Now{" "}
                            <span className='icon'>
                              <i className='icon-right'></i>{" "}
                            </span>
                          </Link>
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
          </PhotoSwipeGallery>
        </Container>
      </section>
      <VideoModal isOpen={isOpen} setOpen={setOpen} id={videoId} />
    </>
  );
};

export default TourListingOneCarousel;
