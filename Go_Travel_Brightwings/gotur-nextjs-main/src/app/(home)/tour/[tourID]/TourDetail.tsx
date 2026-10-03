"use client";

import React, { FormEvent, useEffect, useState } from "react";
import DatePicker from "react-datepicker"; // Date range picker
import Image from "next/image"; // Import the Image component from Next.js
import tourDetailsOneData from "@/data/tourDetailsOneData";
import dynamic from "next/dynamic";
import { Accordion, Col, Container, Row } from "react-bootstrap";
const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});
import VideoModal from "@/components/common/VideoModal/VideoModal";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import { contactFormFields } from "@/data/contactData";
import FullWidthCalendar from "../../../../components/sections/Calender/Calender";
import Link from "next/link";
import { useParams } from "next/navigation";
interface ContactFormField {
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "email" | "textarea";
}
interface Items {
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
}
interface Metadata {
  id: number;
  title: string;
  icon: string;
}
interface TourDetailsOneData {
  id: string;
  title: string;
  titleTwo: string;
  overview: string;
  reviews: number;
  location: string;
  activitiesType: string;
  traveler: number;
  activateDay: string;
  price: string;
  overviewTitle: string;
  topDestinations: string;
  sliderImages: string[];
  highlightList: string[];
  amenities: string[];
  amenitiesTwo: string[];
  relatedTours: Items[];
  comments: Comment[];
  images: string[];
  faqs: { question: string; answer: string }[];
  mapEmbedUrl: string;
}

interface Comment {
  name: string;
  date: string;
  text: string;
  avatar: string;
}

// interface linkProps {
//   params: {tourID : string} ;
// }
interface TourDetailProps{
      tourID: string;
}
// const TourListingOneDetails: React.FC<linkProps> = ({params}) => {
const TourDetail: React.FC<TourDetailProps> = ({ tourID }) => {
//   const { tourID } = useParams() as { tourID: string };
  // const { tourID } = params;
  console.log("tourId: ",tourID);
  
  const allTours = (tourDetailsOneData as TourDetailsOneData[]).find(
    (e) => e?.id.toString() === tourID
  );

  if (!allTours) {
    return <div>Destination not found</div>;
  }

  const [startDate, setStartDate] = useState<Date | null>();
  const [startTime, setStartTime] = useState<Date | null>();
  const [isOpen, setOpen] = useState(false);
  const [videoId, setVideoId] = useState("");
  // const [allTours, setAllTours] = useState<TourDetailsOneData>();

  const formFields = contactFormFields as ContactFormField[];


 const {
    id,
    title,
    titleTwo,
    overview,
    overviewTitle,
    reviews,
    location,
    activitiesType,
    activateDay,
    traveler,
    price,
    comments = [],
    topDestinations,
    relatedTours = [],
    sliderImages = [],
    amenities = [],
    amenitiesTwo = [],
    highlightList = [],
    images = [],
    faqs = [],
    mapEmbedUrl,
  } = allTours;

  useEffect(() => {
  setStartDate(new Date());
}, []);

  const [extraBooking, setExtraBooking] = useState({
    perBooking: false,
    perPerson: false,
  });


  // Optional: dynamic ticket message
  const [ticketMessage, setTicketMessage] = useState(
    "Please, Select Date First"
  );

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

    // You could send bookingData to your API here
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
      <section className="tour-listing-details section-space">
        {/* Destination Section */}
        <div
          className="tour-listing-details__destination wow fadeInUp animated"
          data-wow-duration="1500ms"
          data-wow-delay="500ms"
        >
          <Container>
            <div className="tour-listing-details__destination__inner">
              <div className="tour-listing-details__destination__left">
                <h4 className="tour-listing-details__destination__title">
                  {title}
                </h4>
                <div className="tour-listing-details__destination__revue">
                  <div className="tour-listing-details__destination__ratings-box">
                    <span>({reviews} Review)</span>
                    {[...Array(5)].map((_, index) => (
                      <i key={index} className="icon-star"></i>
                    ))}
                  </div>
                  <div className="tour-listing-details__destination__posted">
                    <i className="icon-pin1"></i>
                    <p className="tour-listing-details__destination__posted-text">
                      {location}
                    </p>
                  </div>
                </div>
              </div>
              <div className="tour-listing-details__destination__right">
                <Link
                  href="javascript:void(0)"
                  className="tour-listing-details__destination__btn gotur-btn"
                >
                  Share <i className="icon-share"></i>
                </Link>
                <div className="tour-listing-details__destination__social__list">
                  <Link href="https://twitter.com">
                    <i className="fab fa-twitter" aria-hidden="true"></i>
                  </Link>
                  <Link href="https://facebook.com">
                    <i className="fab fa-facebook" aria-hidden="true"></i>
                  </Link>
                  <Link href="https://pinterest.com">
                    <i className="fab fa-pinterest-p" aria-hidden="true"></i>
                  </Link>
                  <Link href="https://instagram.com">
                    <i className="fab fa-instagram" aria-hidden="true"></i>
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </div>

        {/* Carousel Section */}
        <div
          className="tour-listing-details__carousel wow fadeInUp animated"
          data-wow-duration="1500ms"
          data-wow-delay="500ms"
        >
          <Container>
            <div className="destination-carousel">
              <div className="destination-carousel__inner gotur-owl__carousel gotur-owl__carousel--basic-nav owl-carousel owl-theme owl-loaded owl-drag">
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
                  }}
                >
                  {sliderImages?.map((img, idx) => (
                    <div key={idx}>
                      <div className="item">
                        <div className="destination-carousel__item">
                          <img src={img} alt="destination" width={'100%'} height={'100%'} />
                          {/* <Image
                            src={img}
                            alt="destination"
                            width={210}
                            height={100}
                          /> */}
                        </div>
                      </div>
                    </div>
                  ))}
                </TinySlider>
                <div className="owl-nav">
                  <button
                    type="button"
                    role="presentation"
                    className="owl-prev"
                    aria-label="carousel button"
                  >
                    <span className="icon-arrow-left"></span>
                  </button>
                  <button
                    type="button"
                    role="presentation"
                    className="owl-next"
                    aria-label="carousel button"
                  >
                    <span className="icon-arrow-right"></span>
                  </button>
                </div>
              </div>
            </div>
          </Container>
        </div>

        {/* Info Section */}
        <div
          className="tour-listing-details__info-area wow fadeInUp"
          data-wow-duration="1500ms"
          data-wow-delay="500ms"
        >
          <Container>
            <ul className="tour-listing-details__info-area__info list-unstyled">
              <li>
                <div className="tour-listing-details__info-area__icon">
                  <i className="icon-location"></i>
                </div>
                <div className="tour-listing-details__info-area__content">
                  <h5 className="tour-listing-details__info-area__title">
                    Location
                  </h5>
                  <p className="tour-listing-details__info-area__text">
                    {location}
                  </p>
                </div>
              </li>
              <li>
                <div className="tour-listing-details__info-area__icon">
                  <i className="icon-travel-and-tourism"></i>
                </div>
                <div className="tour-listing-details__info-area__content">
                  <h5 className="tour-listing-details__info-area__title">
                    Activities Type
                  </h5>
                  <p className="tour-listing-details__info-area__text">
                    {activitiesType}
                  </p>
                </div>
              </li>
              <li>
                <div className="tour-listing-details__info-area__icon">
                  <i className="icon-clock"></i>
                </div>
                <div className="tour-listing-details__info-area__content">
                  <h5 className="tour-listing-details__info-area__title">
                    Activate Day
                  </h5>
                  <p className="tour-listing-details__info-area__text">
                    {activateDay}
                  </p>
                </div>
              </li>
              <li>
                <div className="tour-listing-details__info-area__icon">
                  <i className="icon-group"></i>
                </div>
                <div className="tour-listing-details__info-area__content">
                  <h5 className="tour-listing-details__info-area__title">
                    Traveler
                  </h5>
                  <p className="tour-listing-details__info-area__text">
                    {traveler}
                  </p>
                </div>
              </li>
              <li>
                <Link href="" className="gotur-btn">
                  ${price}/Per Person
                </Link>
              </li>
            </ul>
          </Container>
        </div>

        <Container>
          <div className="row gutter-y-30">
            <div className="col-lg-4">
              <div className="tour-listing-details__sidebar">
                <div
                  className="tour-listing-details__sidebar__item tour-listing-details__sidebar__item-form wow fadeInUp animated"
                  data-wow-delay="0.4s"
                  data-wow-duration="1500ms"
                >
                  <h4 className="tour-listing-details__sidebar__title">
                    Book This Tour
                  </h4>
                  <div className="sidebar-two__form">
                    <form
                      className="sidebar-two__form__inner contact-form-validated"
                      onSubmit={handleSubmit}
                    >
                      <div className="sidebar-two__form__control ">
                        <label htmlFor="checkin">From:</label>

                        <DatePicker
                          selected={startDate}
                          onChange={(date) => setStartDate(date)}
                        />
                        <i className="icon-calendar"></i>
                      </div>
                      <div className="sidebar-two__form__control">
                        <label htmlFor="checkout">Time:</label>
                        <DatePicker
                          selected={startTime}
                          onChange={(date) => setStartTime(date)}
                        />
                      </div>
                      <div className="sidebar-two__form__control">
                        <label htmlFor="checkout">Tickets:</label>
                        <input
                          id="checkout"
                          type="text"
                          name="checkout"
                          placeholder="Please, Select Date Fist"
                          onChange={(e) => setTicketMessage(e.target.value)}
                        />
                      </div>
                      <div className="sidebar-two__form__control sidebar-two__form__control--two">
                        <label
                          className="sidebar-two__form__control--title"
                          htmlFor="guests"
                        >
                          Add Extra:
                        </label>
                        <ul className="list-unstyled sidebar-two__form__checkbox">
                          <li>
                            <input
                              type="checkbox"
                              name="check8"
                              id="check8"
                              onChange={handleCheckboxChange}
                            />
                            <label htmlFor="check8">
                              {" "}
                              <span> Services per booking</span>
                            </label>
                          </li>
                          <li>
                            <input
                              type="checkbox"
                              name="check9"
                              id="check9"
                              onChange={handleCheckboxChange}
                            />
                            <label htmlFor="check9">
                              <span>Services per person</span>
                            </label>
                          </li>
                        </ul>
                      </div>
                      {/* <ul className="list-unstyled sidebar-two__form__add-list">
                        <li>
                          <div className="sidebar-two__form__add">
                            Adult:<span>Contact Us</span>
                          </div>
                        </li>
                        <li>
                          <div className="sidebar-two__form__add">
                            Youth: <span>$16.00</span>
                          </div>
                        </li>
                      </ul>
                      <div className="sidebar-two__form__total">
                        Total:<span>$36.00</span>
                      </div> */}
                      <button
                        type="submit"
                        className="gotur-btn gotur-btn--base"
                        onClick={() => window.open('https://wa.me/917732957732?text=Hello%20I%20want%20to%20book%20a%20tour', "_blank")}
                      >
                        Book Now <i className="icon-right"></i>
                      </button>
                    </form>
                  </div>
                </div>

                <div
                  className="tour-listing-details__sidebar__item tour-listing-details__sidebar__item-location wow fadeInUp animated"
                  data-wow-delay="0.4s"
                  data-wow-duration="1500ms"
                >
                  <div className="tour-listing-details__sidebar__item-box">
                    <iframe
                      title="Google Map"
                      src={mapEmbedUrl}
                      allowFullScreen
                      className="w-100"
                      height="300"
                    />
                  </div>
                </div>
              </div>

            </div>
            <div className="col-lg-8">
              <div className="tour-listing-details__content">
                <div
                  className="tour-listing-details__content__item tour-listing-details__content__text wow fadeInUp animated"
                  data-wow-duration="1500ms"
                  data-wow-delay="500ms"
                >
                  <h4 className="tour-listing-details__title">
                    {overviewTitle}
                  </h4>
                  <p className="tour-listing-details__text">{overview}</p>
                </div>
                {/* Highlight List Section */}
                <div
                  className="tour-listing-details__content__item tour-listing-details__list wow fadeInUp"
                  data-wow-duration="1500ms"
                  data-wow-delay="500ms"
                >
                  <h4 className="tour-listing-details__title">
                    Highlight List
                  </h4>
                  <ul className="tour-listing-details__content__list">
                    {highlightList?.map((item, index) => (
                      <li key={index}>
                        <i className="icon-check-star"></i> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tour Amenities Section */}
                <div
                  className="tour-listing-details__content__item tour-listing-details__amenities wow fadeInUp"
                  data-wow-duration="1500ms"
                  data-wow-delay="500ms"
                >
                  <h4 className="tour-listing-details__title">
                    Tour Amenities
                  </h4>
                  <div className="tour-listing-details__amenities__inner">
                    <ul className="tour-listing-details__amenities__list">
                      {amenities?.map((amenity, index) => (
                        <li key={index}>
                          <i className="fas fa-check"></i> {amenity}
                        </li>
                      ))}
                    </ul>
                    <ul className="tour-listing-details__amenities__list tour-listing-details__amenities__list--two">
                      {amenitiesTwo.map((amenity, index) => (
                        <li key={index}>
                          <i className="fas fa-times"></i> {amenity}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div
                  className="tour-listing-details__content__item tour-listing-details__thumb wow fadeInUp animated"
                  data-wow-duration="1500ms"
                  data-wow-delay="500ms"
                >
                  <div className="row gutter-y-30">
                    {images.map((img, idx) => (
                      <div className="col-md-6" key={idx}>
                        <div className="destination-details__content__thumb__item">
                          <img
                            src={img}
                            alt="destination"
                            width={'100%'}
                            height={'100%'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tour Plan */}

                <div className="tour-listing-details__content__item tour-listing-details__ture-plan">
                  <h4 className="tour-listing-details__title">Tour Plan</h4>
                  <div className="faq-page__accordion faq-accordion gotur-accordion">
                    <Accordion
                      defaultActiveKey="0"
                      //    onSelect={(k) => setActiveKey(k)}
                    >
                      {faqs.map((faq, idx) => (
                        <Accordion.Item eventKey={idx.toString()} key={idx}>
                          <Accordion.Header>
                            <div className="accordion-title">
                              <h4 className="accordion-title__text">
                                {faq.question}
                                <span className="accordion-title__icon"></span>
                              </h4>
                            </div>
                          </Accordion.Header>
                          <Accordion.Body>
                            <div className="accordion-content">
                              <div className="inner">
                                <p className="inner__text">{faq.answer}</p>
                              </div>
                            </div>
                          </Accordion.Body>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                  </div>
                </div>
                {/* Related Tours Section */}
                <div className="tour-listing-details__content__item tour-listing-details__ture-list">
                  <h4 className="tour-listing-details__title">
                    Related Tour List
                  </h4>
                  <PhotoSwipeGallery>
                    <div className="row">
                      {relatedTours?.map((item: Items, index) => (
                        <Col lg={6} md={6} key={index}>
                          <div
                            className="listing-card-four wow fadeInUp"
                            data-wow-duration="1500ms"
                          >
                            <div className="listing-card-four__image">
                              <img
                                src={item.image}
                                alt={item.title}
                                width={100}
                                height={100}
                              />
                              <div className="listing-card-four__btn-group">
                                {item.discount && (
                                  <div className="listing-card-four__discount">
                                    -{item.discount}% off
                                  </div>
                                )}
                                <div className="listing-card-four__featured">
                                  Featured
                                </div>
                              </div>
                              <div className="listing-card-four__btns">
                                <Link href="#">
                                  <i className="far fa-heart"></i>
                                </Link>
                                <div className="listing-card-four__btns__hover">
                                  <Item
                                    original={item.image}
                                    thumbnail={item.image}
                                    width="370"
                                    height="257"
                                  >
                                    {({ ref, open }) => (
                                      <Link
                                        href="#"
                                        className="listing-card-four__popup card__popup"
                                        ref={ref}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          open(e);
                                        }}
                                      >
                                        <span className="icon-image"></span>
                                      </Link>
                                    )}
                                  </Item>

                                  <Link
                                    className="video-popup"
                                    href="https://www.youtube.com/watch?v=0MuL8fd3pb8"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setOpen(true);
                                      setVideoId(item.videoId);
                                    }}
                                  >
                                    <span className="icon-video"></span>
                                  </Link>
                                </div>
                              </div>
                              <ul className="listing-card-four__meta list-unstyled">
                                {item.meta.map((meta: Metadata) => (
                                  <li key={meta.id}>
                                    <Link href="tour-listing-details-2">
                                      {" "}
                                      <span className="listing-card-four__meta__icon">
                                        {" "}
                                        <i className={meta.icon}></i>{" "}
                                      </span>
                                      {meta.title}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="listing-card-four__content">
                              <div className="listing-card-four__rating">
                                <span>({item.reviews} Review)</span>
                                {[...Array(item.rating)].map((_, i) => (
                                  <i key={i} className="icon-star"></i>
                                ))}
                              </div>
                              <h3 className="listing-card-four__title">
                                <Link href={item.link}>{item.title}</Link>
                              </h3>

                              <div className="listing-card-four__content__btn">
                                <div className="listing-card-four__price">
                                  <span className="listing-card-four__price__sub">
                                    Per Day
                                  </span>
                                  <span className="listing-card-four__price__number">
                                    {item.price}
                                  </span>
                                </div>
                                <Link
                                  href={item.link}
                                  className="listing-card-four__btn gotur-btn"
                                >
                                  Book Now{" "}
                                  <span className="icon">
                                    <i className="icon-right"></i>{" "}
                                  </span>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </div>
                  </PhotoSwipeGallery>
                </div>
                <div
                  className="tour-listing-details__content__item tour-listing-details__calender wow fadeInUp animated"
                  data-wow-duration="1500ms"
                  data-wow-delay="500ms"
                >
                  <h4
                    className="tour-listing-details__title wow fadeInUp animated"
                    data-wow-duration="1500ms"
                    data-wow-delay="500ms"
                  >
                    Calendar Price
                  </h4>
                  <FullWidthCalendar />
                </div>
                {/* Comments */}
                <div className="tour-listing-details__content__item tour-listing-details__reviews">
                  <h3
                    className="tour-listing-details__title wow fadeInUp animated "
                    data-wow-duration="1500ms"
                    data-wow-delay="500ms"
                  >
                    {comments.length} Reviews
                  </h3>
                  <ul className="list-unstyled product-details__comment__list">
                    {comments.map((comment, index) => (
                      <li
                        key={index}
                        className="product-details__comment__card wow fadeInUp animated"
                        data-wow-delay="100ms"
                        data-wow-duration="1500ms"
                      >
                        <div className="product-details__comment__card__image">
                          <img
                            src={comment.avatar}
                            alt={comment.name}
                            width={100}
                            height={100}
                          />
                        </div>
                        <div className="product-details__comment__card__content">
                          <div className="product-details__comment__card__top">
                            <div className="product-details__comment__card__info">
                              <h3 className="product-details__comment__card__title">
                                {comment.name}
                              </h3>
                              <p className="product-details__comment__card__date">
                                {comment.date}
                              </p>
                            </div>
                            <div className="product-details__comment__card__star">
                              <span className="fa fa-star"></span>
                              <span className="fa fa-star"></span>
                              <span className="fa fa-star"></span>
                              <span className="fa fa-star"></span>
                              <span className="fa fa-star"></span>
                            </div>
                          </div>
                          <p className="product-details__comment__card__text">
                            {comment.text}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="tour-listing-details__content__item tour-listing-details__add-reviews">
                  <div className="contact-page__contact">
                    <h2 className="tour-listing-details__title wow fadeInUp animated">
                      Add a Review
                    </h2>
                    <div
                      className="product-details__form-ratings wow fadeInUp animated"
                      data-wow-duration="1500ms"
                      data-wow-delay="500ms"
                    >
                      <p className="product-details__form-ratings__label">
                        Your Rating*
                      </p>
                      <span className="far fa-star"></span>
                      <span className="far fa-star"></span>
                      <span className="far fa-star"></span>
                      <span className="far fa-star"></span>
                      <span className="far fa-star"></span>
                    </div>
                    <form
                      className="comments-form__form contact-form-validated product-details__form__form form-one wow fadeInUp animated"
                      onSubmit={handleComment}
                    >
                      <div className="form-one__group">
                        {formFields.map((field, index) => (
                          <div
                            key={index}
                            className={`form-one__control ${
                              field.type === "textarea"
                                ? "form-one__control--full"
                                : ""
                            }`}
                          >
                            <label htmlFor={field.name}>{field.label}</label>
                            {field.type === "textarea" ? (
                              <textarea
                                name={field.name}
                                id={field.name}
                                placeholder={field.placeholder}
                              ></textarea>
                            ) : (
                              <input
                                type={field.type}
                                name={field.name}
                                id={field.name}
                                placeholder={field.placeholder}
                              />
                            )}
                          </div>
                        ))}
                        <div className="form-one__control form-one__control--full">
                          <button
                            type="submit"
                            className="gotur-btn gotur-btn--base"
                          >
                            Send Message <i className="icon-arrow-right"></i>
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
      <VideoModal isOpen={isOpen} setOpen={setOpen} id={videoId} />
    </>
  );
};

export default TourDetail;
