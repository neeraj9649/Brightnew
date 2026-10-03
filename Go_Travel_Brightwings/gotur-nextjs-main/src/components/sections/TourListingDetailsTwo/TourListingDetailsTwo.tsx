"use client";
import React, { FormEvent, useState } from "react";
import DatePicker from "react-datepicker";
import Image from "next/image";
import tourDetailsOneData from "@/data/tourDetailsOneData";
import { Accordion, Col, Container } from "react-bootstrap";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import { Gallery as PhotoSwipeGallery, Item as PhotoSwipeItem } from "react-photoswipe-gallery";
import { contactFormFields } from "@/data/contactData";
import FullWidthCalendar from "../Calender/Calender";
import Slider from "react-slick";
import Link from "next/link";

/* ---------------- Types ---------------- */
interface ContactFormField {
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "email" | "textarea";
}

interface TourMeta {
  id: number;
  title: string;
  icon: string;
}

interface TourRelatedItem {
  id: number;
  image: string;
  title: string;
  link: string;
  price: string;
  rating: number;
  reviews: number;
  videoId: string;
  discount: string;
  meta: TourMeta[];
}

interface Comment {
  name: string;
  date: string;
  text: string;
  avatar: string;
  rating?: number;
}

interface TourDetailsOneData {
  id: string | number;
  title: string;
  titleTwo: string;
  overview: string;
  reviews: number;
  location: string;
  activitiesType: string;
  traveler: number;
  activateDay: string;
  price: string | number;
  overviewTitle: string;
  topDestinations: string;
  sliderImages: string[];
  slider2Images: string[];
  highlightList: string[];
  amenities: string[];
  amenitiesTwo: string[];
  relatedTours: TourRelatedItem[];
  comments: Comment[];
  images: string[];
  mapEmbedUrl: string;
  faqs: { question: string; answer: string }[];
}

/* ---------------- Component ---------------- */
const TourListingTwoDetails: React.FC = () => {
  // Initialize states properly
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isOpen, setOpen] = useState(false);
  const [videoId, setVideoId] = useState("");
  const formFields = contactFormFields as ContactFormField[];

  // Typed array of tours
  const tours: TourDetailsOneData[] = tourDetailsOneData;

  const settings = {
    className: "center",
    centerMode: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    gutter: 30,
    loop: false,
    nav: false,
    autoplay: false,
    controls: false,
    mouseDrag: true,
    centerPadding: "230px",
    responsive: [
      { breakpoint: 1199, settings: { slidesToShow: 2, slidesToScroll: 1, infinite: true, centerPadding: "230px" } },
      { breakpoint: 992, settings: { slidesToShow: 2, slidesToScroll: 1, centerPadding: "70px" } },
      { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 1, centerPadding: "100px" } },
      { breakpoint: 575, settings: { slidesToShow: 1, slidesToScroll: 1, centerPadding: "30px" } },
    ],
  };

  const [extraBooking, setExtraBooking] = useState({ perBooking: false, perPerson: false });
  const [ticketMessage] = useState("Please, Select Date First");

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    setExtraBooking((prev) => ({
      ...prev,
      perBooking: id === "check8" ? checked : prev.perBooking,
      perPerson: id === "check9" ? checked : prev.perPerson,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!startDate || !startTime) {
      alert("Please select both date and time.");
      return;
    }
    const bookingData = {
      date: startDate.toISOString(),
      time: startTime.toISOString(),
      extras: extraBooking,
      tickets: ticketMessage,
    };
    console.log("Booking Submitted:", bookingData);
  };

  const handleComment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });
    console.log("Form Submitted:", data);
  };

  return (
    <>
      {/* Render each tour from the array */}
      {tours.map((tour) => (
        <React.Fragment key={tour.id}>
          {/* Carousel Section */}
          <div className="tour-one section-space-top wow fadeInUp animated" data-wow-duration="1500ms" data-wow-delay="500ms">
            <div className="tour-one__carousel tour-two__carousel gotur-owl__carousel owl-carousel owl-theme owl-loaded owl-drag">
              <Slider {...settings}>
                {tour.slider2Images.map((img, idx) => (
                  <div key={idx}>
                    <div className="item">
                      <div className="tour-one__item" style={{ position: "relative", width: "100%", height: 400 }}>
                        {/* Use fill + objectFit so images scale correctly */}
                        <Image src={img} alt={tour.title} fill style={{ objectFit: "cover" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
          </div>

          <section className="tour-listing-details section-space-bottom">
            {/* Destination Section */}
            <div className="tour-listing-details__destination wow fadeInUp animated" data-wow-duration="1500ms" data-wow-delay="500ms">
              <Container>
                <div className="tour-listing-details__destination__inner">
                  <div className="tour-listing-details__destination__left">
                    <h4 className="tour-listing-details__destination__title">{tour.title}</h4>
                    <div className="tour-listing-details__destination__revue">
                      <div className="tour-listing-details__destination__ratings-box">
                        <span>({tour.reviews} Review)</span>
                        {[...Array(5)].map((_, index) => (
                          <i key={index} className="icon-star" />
                        ))}
                      </div>
                      <div className="tour-listing-details__destination__posted">
                        <i className="icon-pin1" />
                        <p className="tour-listing-details__destination__posted-text">{tour.location}</p>
                      </div>
                    </div>
                  </div>
                  <div className="tour-listing-details__destination__right">
                    <Link href="#" className="tour-listing-details__destination__btn gotur-btn">
                      Share <i className="icon-share" />
                    </Link>
                    <div className="tour-listing-details__destination__social__list">
                      <Link href="https://twitter.com"><i className="fab fa-twitter" aria-hidden="true" /></Link>
                      <Link href="https://facebook.com"><i className="fab fa-facebook" aria-hidden="true" /></Link>
                      <Link href="https://pinterest.com"><i className="fab fa-pinterest-p" aria-hidden="true" /></Link>
                      <Link href="https://instagram.com"><i className="fab fa-instagram" aria-hidden="true" /></Link>
                    </div>
                  </div>
                </div>
              </Container>
            </div>

            {/* Info Section */}
            <div className="tour-listing-details__info-area wow fadeInUp" data-wow-duration="1500ms" data-wow-delay="500ms">
              <Container>
                <ul className="tour-listing-details__info-area__info list-unstyled">
                  <li>
                    <div className="tour-listing-details__info-area__icon"><i className="icon-location" /></div>
                    <div className="tour-listing-details__info-area__content">
                      <h5 className="tour-listing-details__info-area__title">Location</h5>
                      <p className="tour-listing-details__info-area__text">{tour.location}</p>
                    </div>
                  </li>
                  <li>
                    <div className="tour-listing-details__info-area__icon"><i className="icon-travel-and-tourism" /></div>
                    <div className="tour-listing-details__info-area__content">
                      <h5 className="tour-listing-details__info-area__title">Activities Type</h5>
                      <p className="tour-listing-details__info-area__text">{tour.activitiesType}</p>
                    </div>
                  </li>
                  <li>
                    <div className="tour-listing-details__info-area__icon"><i className="icon-clock" /></div>
                    <div className="tour-listing-details__info-area__content">
                      <h5 className="tour-listing-details__info-area__title">Activate Day</h5>
                      <p className="tour-listing-details__info-area__text">{tour.activateDay}</p>
                    </div>
                  </li>
                  <li>
                    <div className="tour-listing-details__info-area__icon"><i className="icon-group" /></div>
                    <div className="tour-listing-details__info-area__content">
                      <h5 className="tour-listing-details__info-area__title">Traveler</h5>
                      <p className="tour-listing-details__info-area__text">{tour.traveler}</p>
                    </div>
                  </li>
                  <li>
                    <Link href="#" className="gotur-btn">${tour.price}/Per Person</Link>
                  </li>
                </ul>
              </Container>
            </div>

            <Container>
              <div className="row gutter-y-30">
                <div className="col-lg-8">
                  <div className="tour-listing-details__content">
                    <div className="tour-listing-details__content__item tour-listing-details__content__text wow fadeInUp animated" data-wow-duration="1500ms" data-wow-delay="500ms">
                      <h4 className="tour-listing-details__title">{tour.overviewTitle}</h4>
                      <p className="tour-listing-details__text">{tour.overview}</p>
                    </div>

                    {/* Highlight List */}
                    <div className="tour-listing-details__content__item tour-listing-details__list wow fadeInUp" data-wow-duration="1500ms" data-wow-delay="500ms">
                      <h4 className="tour-listing-details__title">Highlight List</h4>
                      <ul className="tour-listing-details__content__list">
                        {tour.highlightList.map((item, index) => (
                          <li key={index}><i className="icon-check-star" /> {item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Amenities */}
                    <div className="tour-listing-details__content__item tour-listing-details__amenities wow fadeInUp" data-wow-duration="1500ms" data-wow-delay="500ms">
                      <h4 className="tour-listing-details__title">Tour Amenities</h4>
                      <div className="tour-listing-details__amenities__inner">
                        <ul className="tour-listing-details__amenities__list">
                          {tour.amenities.map((amenity, index) => <li key={index}><i className="fas fa-check" /> {amenity}</li>)}
                        </ul>
                        <ul className="tour-listing-details__amenities__list tour-listing-details__amenities__list--two">
                          {tour.amenitiesTwo.map((amenity, index) => <li key={index}><i className="fas fa-times" /> {amenity}</li>)}
                        </ul>
                      </div>
                    </div>

                    {/* Images grid */}
                    <div className="tour-listing-details__content__item tour-listing-details__thumb wow fadeInUp animated" data-wow-duration="1500ms" data-wow-delay="500ms">
                      <div className="row gutter-y-30">
                        {tour.images.map((img, idx) => (
                          <div className="col-md-6" key={idx}>
                            <div className="destination-details__content__thumb__item" style={{ position: "relative", width: "100%", height: 220 }}>
                              <Image src={img} alt={tour.title} fill style={{ objectFit: "cover" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* FAQs / Accordion */}
                    <div className="tour-listing-details__content__item tour-listing-details__ture-plan">
                      <h4 className="tour-listing-details__title">Tour Plan</h4>
                      <div className="faq-page__accordion faq-accordion gotur-accordion">
                        <Accordion defaultActiveKey="0">
                          {tour.faqs.map((faq, idx) => (
                            <Accordion.Item eventKey={idx.toString()} key={idx}>
                              <Accordion.Header>
                                <div className="accordion-title">
                                  <h4 className="accordion-title__text">
                                    {faq.question}
                                    <span className="accordion-title__icon" />
                                  </h4>
                                </div>
                              </Accordion.Header>
                              <Accordion.Body>
                                <div className="accordion-content"><div className="inner"><p className="inner__text">{faq.answer}</p></div></div>
                              </Accordion.Body>
                            </Accordion.Item>
                          ))}
                        </Accordion>
                      </div>
                    </div>

                    {/* Related Tours */}
                    <div className="tour-listing-details__content__item tour-listing-details__ture-list">
                      <h4 className="tour-listing-details__title">Related Tour List</h4>
                      <PhotoSwipeGallery>
                        <div className="row">
                          {tour.relatedTours.map((item, index) => (
                            <Col lg={6} md={6} key={index}>
                              <div className="listing-card-four wow fadeInUp" data-wow-duration="1500ms">
                                <div className="listing-card-four__image" style={{ position: "relative", width: "100%", height: 200 }}>
                                  <Image src={item.image} alt={item.title} fill style={{ objectFit: "cover" }} />
                                  <div className="listing-card-four__btn-group">
                                    {item.discount && <div className="listing-card-four__discount">-{item.discount}% off</div>}
                                    <div className="listing-card-four__featured">Featured</div>
                                  </div>

                                  <div className="listing-card-four__btns">
                                    <Link href="#"><i className="far fa-heart" /></Link>
                                    <div className="listing-card-four__btns__hover">
                                      <PhotoSwipeItem original={item.image} thumbnail={item.image} width="370" height="257">
                                        {({ ref, open }) => (
                                          <Link href="#" className="listing-card-four__popup card__popup" ref={ref} onClick={(e) => { e.preventDefault(); open(e); }}>
                                            <span className="icon-image" />
                                          </Link>
                                        )}
                                      </PhotoSwipeItem>

                                      <Link className="video-popup" href="#" onClick={(e) => { e.preventDefault(); setOpen(true); setVideoId(item.videoId); }}>
                                        <span className="icon-video" />
                                      </Link>
                                    </div>
                                  </div>

                                  <ul className="listing-card-four__meta list-unstyled">
                                    {item.meta.map((meta) => (
                                      <li key={meta.id}>
                                        <Link href="#"><span className="listing-card-four__meta__icon"><i className={meta.icon} /></span>{meta.title}</Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="listing-card-four__content">
                                  <div className="listing-card-four__rating">
                                    <span>({item.reviews} Review)</span>
                                    {[...Array(item.rating)].map((_, i) => <i key={i} className="icon-star" />)}
                                  </div>
                                  <h3 className="listing-card-four__title"><Link href={item.link}>{item.title}</Link></h3>
                                  <div className="listing-card-four__content__btn">
                                    <div className="listing-card-four__price">
                                      <span className="listing-card-four__price__sub">Per Day</span>
                                      <span className="listing-card-four__price__number">{item.price}</span>
                                    </div>
                                    <Link href={item.link} className="listing-card-four__btn gotur-btn">Book Now <span className="icon"><i className="icon-right" /></span></Link>
                                  </div>
                                </div>
                              </div>
                            </Col>
                          ))}
                        </div>
                      </PhotoSwipeGallery>
                    </div>

                    {/* Calendar */}
                    <div className="tour-listing-details__content__item tour-listing-details__calender wow fadeInUp animated" data-wow-duration="1500ms" data-wow-delay="500ms">
                      <h4 className="tour-listing-details__title">Calendar Price</h4>
                      <FullWidthCalendar />
                    </div>

                    {/* Comments */}
                    <div className="tour-listing-details__content__item tour-listing-details__reviews">
                      <h3 className="tour-listing-details__title">{tour.comments.length} Reviews</h3>
                      <ul className="list-unstyled product-details__comment__list">
                        {tour.comments.map((comment, index) => (
                          <li key={index} className="product-details__comment__card wow fadeInUp animated">
                            <div className="product-details__comment__card__image" style={{ position: "relative", width: 80, height: 80 }}>
                              <Image src={comment.avatar} alt={comment.name} fill style={{ objectFit: "cover", borderRadius: "50%" }} />
                            </div>
                            <div className="product-details__comment__card__content">
                              <div className="product-details__comment__card__top">
                                <div className="product-details__comment__card__info">
                                  <h3 className="product-details__comment__card__title">{comment.name}</h3>
                                  <p className="product-details__comment__card__date">{comment.date}</p>
                                </div>
                                <div className="product-details__comment__card__star">
                                  <span className="fa fa-star" /><span className="fa fa-star" /><span className="fa fa-star" /><span className="fa fa-star" /><span className="fa fa-star" />
                                </div>
                              </div>
                              <p className="product-details__comment__card__text">{comment.text}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Add a Review Form */}
                    <div className="tour-listing-details__content__item tour-listing-details__add-reviews">
                      <div className="contact-page__contact">
                        <h2 className="tour-listing-details__title">Add a Review</h2>
                        <div className="product-details__form-ratings">
                          <p className="product-details__form-ratings__label">Your Rating*</p>
                          <span className="far fa-star" /><span className="far fa-star" /><span className="far fa-star" /><span className="far fa-star" /><span className="far fa-star" />
                        </div>

                        <form className="comments-form__form contact-form-validated product-details__form__form form-one" onSubmit={handleComment}>
                          <div className="form-one__group">
                            {formFields.map((field, index) => (
                              <div key={index} className={`form-one__control ${field.type === "textarea" ? "form-one__control--full" : ""}`}>
                                <label htmlFor={field.name}>{field.label}</label>
                                {field.type === "textarea" ? (
                                  <textarea name={field.name} id={field.name} placeholder={field.placeholder}></textarea>
                                ) : (
                                  <input type={field.type} name={field.name} id={field.name} placeholder={field.placeholder} />
                                )}
                              </div>
                            ))}
                            <div className="form-one__control form-one__control--full">
                              <button type="submit" className="gotur-btn gotur-btn--base">Send Message <i className="icon-arrow-right" /></button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Sidebar */}
                <div className="col-lg-4">
                  <div className="tour-listing-details__sidebar">
                    <div className="tour-listing-details__sidebar__item tour-listing-details__sidebar__item-form wow fadeInUp animated">
                      <h4 className="tour-listing-details__sidebar__title">Book This Tour</h4>
                      <div className="sidebar-two__form">
                        <form className="sidebar-two__form__inner contact-form-validated" onSubmit={handleSubmit}>
                          <div className="sidebar-two__form__control">
                            <label htmlFor="checkin">From:</label>
                            <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} />
                            <i className="icon-calendar" />
                          </div>

                          <div className="sidebar-two__form__control">
                            <label htmlFor="checkout">Time:</label>
                            <DatePicker selected={startTime} onChange={(date) => setStartTime(date)} />
                          </div>

                          <div className="sidebar-two__form__control">
                            <label htmlFor="checkout">Tickets:</label>
                            <input id="checkout" type="text" name="checkout" placeholder="Please, Select Date First" />
                          </div>

                          <div className="sidebar-two__form__control sidebar-two__form__control--two">
                            <label className="sidebar-two__form__control--title" htmlFor="guests">Add Extra:</label>
                            <ul className="list-unstyled sidebar-two__form__checkbox">
                              <li><input type="checkbox" name="check8" id="check8" onChange={handleCheckboxChange} /><label htmlFor="check8"> <span> Services per booking</span></label></li>
                              <li><input type="checkbox" name="check9" id="check9" onChange={handleCheckboxChange} /><label htmlFor="check9"><span>Services per person</span></label></li>
                            </ul>
                          </div>

                          <ul className="list-unstyled sidebar-two__form__add-list">
                            <li><div className="sidebar-two__form__add">Adult:<span>$20.00</span></div></li>
                            <li><div className="sidebar-two__form__add">Youth: <span>$16.00</span></div></li>
                          </ul>

                          <div className="sidebar-two__form__total">Total:<span>$36.00</span></div>
                          <button type="submit" className="gotur-btn gotur-btn--base">Book Now <i className="icon-right" /></button>
                        </form>
                      </div>
                    </div>

                    <div className="tour-listing-details__sidebar__item tour-listing-details__sidebar__item-location wow fadeInUp animated">
                      <div className="tour-listing-details__sidebar__item-box">
                        <iframe title="Google Map" src={tour.mapEmbedUrl} allowFullScreen className="w-100" height="300" />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </Container>
          </section>
        </React.Fragment>
      ))}

      <VideoModal isOpen={isOpen} setOpen={setOpen} id={videoId} />
    </>
  );
};

export default TourListingTwoDetails;
