"use client";
import React, { useState } from "react";
import { tourListingOneLeftData } from "@/data/tourListingOneLeftData";
import Image, { StaticImageData } from "next/image";
import { Container, Row, Col } from "react-bootstrap";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import TourSidebar from "@/components/common/TourSidebar/TourSidebar";
import Link from "next/link";
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
const TourListingOneLeft: React.FC = () => {
  const [isOpen, setOpen] = useState(false);
  const [videoId, setVideoId] = useState("");
  const { items }: TourListingData = tourListingOneLeftData;
  return (
    <>
      <section className='tour-listing-page section-space '>
        <div className='container '>
          <Row className='gutter-y-10'>
            <Col lg={4}>
              <TourSidebar />
            </Col>

            {/* Tour Listings */}
            <Col lg={8}>
              <PhotoSwipeGallery>
                <Row className='gutter-y-30 gutter-x-30'>
                  {items.map((item) => (
                    <Col xs={12} sm={6} key={item.id}>
                      <div className='item '>
                        <div
                          className='listing-card-four wow fadeInUp'
                          data-wow-duration='1500ms'
                        >
                          <div className='listing-card-four__image'>
                            <img src={item.image} alt={item.image} height={'100%'} width={'100%'} />
                            {/* <Image src={item.image} alt={item.title} width={100} height={100}/> */}
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
                                  width='270'
                                  height='157'
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
                                href={`/tour/${item.link}`}
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
                    </Col>
                  ))}
                </Row>
              </PhotoSwipeGallery>
            </Col>
          </Row>
        </div>
      </section>
      <VideoModal isOpen={isOpen} setOpen={setOpen} id={videoId} />
    </>
  );
};

export default TourListingOneLeft;
