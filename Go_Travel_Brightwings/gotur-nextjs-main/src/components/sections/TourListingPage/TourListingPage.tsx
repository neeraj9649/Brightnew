"use client";
import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { Container, Row, Col, Form } from "react-bootstrap";
import { tourListingPageData } from "@/data/tourListingPageData";
import CustomReactSelect from "@/components/common/CustomReactSelect/CustomReactSelect";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import VideoModal from "@/components/common/VideoModal/VideoModal";
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

const TourListingPage: React.FC = () => {
  const {
    sectionTitle,
    sectionTagline,
    filterOptions,
    tours,
    images,
  }: TourListingData = tourListingPageData;
  const [isOpen, setOpen] = useState(false);
  const [videoId, setVideoId] = useState("");

  const [filterValues, setFilterValues] = useState<{ [key: string]: string }>(
    {}
  );

  const onFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <>
      <section className='tour-listing-page section-space' id='popular'>
        <PhotoSwipeGallery>
          <Container>
            <div className='sec-title text-center'>
              <h6 className='sec-title__tagline d'>
                <TextAnimation text={sectionTagline} animationType='right' />
              </h6>
              <h3 className='sec-title__title d-md-flex justify-content-center'>
                <TextAnimation text={sectionTitle} animationType='left' />
              </h3>
            </div>

            <div
              className='listing-from wow fadeInUp'
              data-wow-duration='1500ms'
              data-wow-delay='400ms'
            >
              <Form method='get' action='tour-listing-1'>
                <Row className='gutter-y-20 gutter-x-20'>
                  {Object.keys(filterOptions).map((key, index) => {
                    const values =
                      filterOptions[key as keyof typeof filterOptions];
                    const placeholder = values[0];
                    const options = values.slice(1).map((option) => ({
                      value: option.toLowerCase(),
                      label: option,
                    }));

                    return (
                      <Col lg={3} md={4} sm={6} key={index}>
                        <CustomReactSelect
                          options={options}
                          value={filterValues[key] || ""}
                          onChange={(val) => onFilterChange(key, val)}
                          placeholder={placeholder}
                        />
                      </Col>
                    );
                  })}

                  <Col lg={3} md={4} sm={6}>
                    <div className='listing-from__control'>
                      <button className='gotur-btn' type='button'>
                        Search Now
                      </button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </div>

            <Row className='gutter-y-40'>
              {tours.map((tour, index) => (
                <Col lg={4} md={6} key={index}>
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
                        <div className='listing-card-two__discount'>
                          {tour.discount}
                        </div>
                      </div>
                      <div className='listing-card-two__btns'>
                        <div className='listing-card-two__btns__hover'>
                          <Item
                            original={tour.image}
                            thumbnail={tour.image}
                            width='370'
                            height='220'
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
                        <Link href='tour-listing-details-2'>{tour.title}</Link>
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
            </Row>
          </Container>
        </PhotoSwipeGallery>
        <div className='tour-listing-page__element'>
          <Image src={images.corkiImage} alt='corki-image' />
        </div>
        <div className='tour-listing-page__element-two'>
          <Image src={images.listImage} alt='list-image' />
        </div>
      </section>
      <VideoModal id={videoId} isOpen={isOpen} setOpen={setOpen} />
    </>
  );
};

export default TourListingPage;
