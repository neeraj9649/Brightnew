"use client";
import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { Container, Row, Col } from "react-bootstrap";
import { tourListingPageData } from "@/data/tourListingPageData";
import Pagination from "@/components/common/Pagination/Pagination";
import TourSidebar from "@/components/common/TourSidebar/TourSidebar";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import Link from "next/link";

interface TourListingData {
  sectionTitle: string;
  sectionTagline: string;
  filterOptions: {
    locations: string[];
    hotelTypes: string[];
    tourBudgets: string[];
    activities: string[];
    reviews: string[];
    prices: string[];
  };
  tours: {
    image: string;
    title: string;
    location: string;
    duration: string;
    price: string;
    discount?: string;
    featured?: boolean;
    videoId: string;
  }[];
  images: {
    corkiImage: string;
    listImage: string;
  };
}

const TourListingTwoLeft: React.FC = () => {
  const [isOpen, setOpen] = useState(false);
  const [videoId, setVideoId] = useState("");
  const { tours }: TourListingData = tourListingPageData;

  return (
    <>
      <section className='tour-listing-page section-space' id='popular'>
        <PhotoSwipeGallery>
          <Container>
            <Row className='gutter-y-40'>
              <Col lg={4}>
                <TourSidebar />
              </Col>
              <Col lg={8}>
                <Row className='gutter-y-30'>
                  {tours.map((tour, index) => (
                    <Col md={6} key={index}>
                      <div
                        className='listing-card-two wow fadeInUp'
                        data-wow-duration='1500ms'
                        data-wow-delay={`${100 * (index + 1)}ms`}
                      >
                        <div className='listing-card-two__image'>
                          <Image src={tour.image} alt={tour.title} />
                          <Link
                            href='tour-listing-details-2'
                            className='listing-card-two__overlay'
                          ></Link>
                          <div className='listing-card-two__btn-group'>
                            {tour.discount && (
                              <div className='listing-card-two__discount'>
                                {tour.discount}
                              </div>
                            )}

                            {tour.featured && (
                              <div className='listing-card-two__featured'>
                                Featured
                              </div>
                            )}
                          </div>
                          <div className='listing-card-two__btns'>
                            <Item
                              original={tour.image}
                              thumbnail={tour.image}
                              width='370'
                              height='257'
                            >
                              {({ ref, open }) => (
                                <Link
                                  href='#'
                                  className='listing-card-two__popup card__popup'
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
                                setVideoId(tour.videoId);
                              }}
                            >
                              <span className='icon-video'></span>
                            </Link>
                          </div>
                        </div>
                        <div className='listing-card-two__content'>
                          <div className='listing-card-two__rating'>
                            <span>(10 Review)</span>
                            <i className='icon-star'></i>
                            <i className='icon-star'></i>
                            <i className='icon-star'></i>
                            <i className='icon-star'></i>
                            <i className='icon-star'></i>
                          </div>
                          <h3 className='listing-card-two__title'>
                            <Link href='tour-listing-details-2'>
                              {tour.title}
                            </Link>
                          </h3>
                          <div className='listing-card-two__content__inner'>
                            <ul className='listing-card-two__meta list-unstyled'>
                              <li>
                                <Link href='tour-listing-details-2'>
                                  <span className='listing-card-two__meta__icon'>
                                    <i className='icon-pin'></i>
                                  </span>
                                  {tour.location}
                                </Link>
                              </li>
                              <li>
                                <Link href='tour-listing-details-2'>
                                  <span className='listing-card-two__meta__icon'>
                                    <i className='icon-calendar'></i>
                                  </span>
                                  {tour.duration}
                                </Link>
                              </li>
                            </ul>
                            <div className='listing-card-two__price'>
                              <h5 className='listing-card-two__price__number'>
                                {tour.price}
                                <span>/Per day</span>
                              </h5>
                              <i className='far fa-heart'></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Col>
                  ))}
                  <Col lg={12}>
                    <Pagination />
                  </Col>
                </Row>
              </Col>
            </Row>
          </Container>
        </PhotoSwipeGallery>
      </section>
      <VideoModal isOpen={isOpen} id={videoId} setOpen={setOpen} />
    </>
  );
};

export default TourListingTwoLeft;
