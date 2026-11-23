"use client";

import React, { FormEvent, useEffect, useState } from "react";
import DatePicker from "react-datepicker"; // Date range picker
import dynamic from "next/dynamic";
import { Accordion, Col, Container } from "react-bootstrap";
const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});
import VideoModal from "@/components/common/VideoModal/VideoModal";
import TourCard from "@/components/common/TourCard/TourCard";
import { Gallery as PhotoSwipeGallery } from "react-photoswipe-gallery";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { blogDate, getTour, postTourReview, type Tour } from "@/lib/api";

/**
 * One tour page, loaded from the API by the slug in the address (/tour/<slug>/).
 * The slug is read from the address, not the build-time param, because tours added in the admin
 * portal have no page file: nginx serves /tour/_/ for them and this still shows the right tour.
 */
const TourDetail: React.FC<{ tourID?: string }> = () => {
  const pathname = usePathname();
  const slug = decodeURIComponent(pathname.split("/").filter(Boolean)[1] ?? "");
  const [tour, setTour] = useState<Tour | null>(null);
  const [loadError, setLoadError] = useState("");

  const [startDate, setStartDate] = useState<Date | null>();
  const [startTime, setStartTime] = useState<Date | null>();
  const [isOpen, setOpen] = useState(false);
  const [videoId, setVideoId] = useState("");
  const [extraBooking, setExtraBooking] = useState({ perBooking: false, perPerson: false });
  const [ticketMessage, setTicketMessage] = useState("Please, Select Date First");
  const [rating, setRating] = useState(0);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");

  useEffect(() => {
    setStartDate(new Date());
  }, []);

  useEffect(() => {
    setTour(null);
    setLoadError("");
    if (!slug || slug === "_") {
      setLoadError("This tour was not found");
      return;
    }
    getTour(slug).then(setTour).catch((e: Error) => setLoadError(e.message));
  }, [slug]);

  // Share: copies this tour's link. Pasting it in a browser opens the same tour page.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(""), 2500);
    return () => clearTimeout(timer);
  }, [copied]);
  const copyLink = async () => {
    const url = window.location.origin + window.location.pathname;
    try {
      await navigator.clipboard.writeText(url);
      setCopied("ok");
    } catch {
      // Older browsers or no clipboard permission: copy through a hidden text box.
      const box = document.createElement("textarea");
      box.value = url;
      box.setAttribute("readonly", "");
      box.style.position = "fixed";
      box.style.opacity = "0";
      document.body.appendChild(box);
      box.select();
      const ok = document.execCommand("copy");
      box.remove();
      setCopied(ok ? "ok" : "fail");
    }
  };

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
    console.log("Booking Submitted:", {
      date: startDate.toISOString(),
      time: startTime.toISOString(),
      extras: extraBooking,
      tickets: ticketMessage,
    });
  };

  const handleReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    if (!rating) {
      setResult({ ok: false, text: "Please choose a star rating." });
      return;
    }
    const form = e.currentTarget;
    const value = (name: string) => String(new FormData(form).get(name) ?? "").trim();
    setSending(true);
    setResult(null);
    try {
      await postTourReview(slug, { name: value("name"), email: value("email"), rating, message: value("message") });
      form.reset();
      setRating(0);
      setResult({ ok: true, text: "Thank you! Your review will appear here once it is approved." });
    } catch (err) {
      setResult({ ok: false, text: err instanceof Error ? err.message : "We couldn't send your review. Please try again." });
    } finally {
      setSending(false);
    }
  };

  if (loadError || !tour) {
    return (
      <section className="tour-listing-details section-space">
        <Container>
          <p className="text-center">
            {loadError ? <>{loadError}. <Link href="/tours/">See all tours</Link></> : "Loading…"}
          </p>
        </Container>
      </section>
    );
  }

  const reviews = tour.reviews;
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
                  {tour.headline || tour.title}
                </h4>
                <div className="tour-listing-details__destination__revue">
                  <div className="tour-listing-details__destination__ratings-box">
                    <span>({reviews.length} Review)</span>
                    {[...Array(tour.rating)].map((_, index) => (
                      <i key={index} className="icon-star"></i>
                    ))}
                  </div>
                  {tour.location && (
                    <div className="tour-listing-details__destination__posted">
                      <i className="icon-pin1"></i>
                      <p className="tour-listing-details__destination__posted-text">
                        {tour.location}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="tour-listing-details__destination__right">
                <button
                  type="button"
                  onClick={copyLink}
                  className="tour-listing-details__destination__btn gotur-btn"
                >
                  Share <i className="icon-share"></i>
                </button>
              </div>
            </div>
          </Container>
        </div>

        {/* Carousel Section */}
        {tour.slider_images.length > 0 && (
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
                    {tour.slider_images.map((img, idx) => (
                      <div key={idx}>
                        <div className="item">
                          <div className="destination-carousel__item">
                            <img src={img} alt={tour.title} width={"100%"} height={"100%"} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </TinySlider>
                  <div className="owl-nav">
                    <button type="button" role="presentation" className="owl-prev" aria-label="carousel button">
                      <span className="icon-arrow-left"></span>
                    </button>
                    <button type="button" role="presentation" className="owl-next" aria-label="carousel button">
                      <span className="icon-arrow-right"></span>
                    </button>
                  </div>
                </div>
              </div>
            </Container>
          </div>
        )}

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
                  <h5 className="tour-listing-details__info-area__title">Location</h5>
                  <p className="tour-listing-details__info-area__text">{tour.location}</p>
                </div>
              </li>
              <li>
                <div className="tour-listing-details__info-area__icon">
                  <i className="icon-travel-and-tourism"></i>
                </div>
                <div className="tour-listing-details__info-area__content">
                  <h5 className="tour-listing-details__info-area__title">Activities Type</h5>
                  <p className="tour-listing-details__info-area__text">{tour.activity_type}</p>
                </div>
              </li>
              <li>
                <div className="tour-listing-details__info-area__icon">
                  <i className="icon-clock"></i>
                </div>
                <div className="tour-listing-details__info-area__content">
                  <h5 className="tour-listing-details__info-area__title">Activate Day</h5>
                  <p className="tour-listing-details__info-area__text">{tour.active_days}</p>
                </div>
              </li>
              <li>
                <div className="tour-listing-details__info-area__icon">
                  <i className="icon-group"></i>
                </div>
                <div className="tour-listing-details__info-area__content">
                  <h5 className="tour-listing-details__info-area__title">Traveler</h5>
                  <p className="tour-listing-details__info-area__text">{tour.travelers}</p>
                </div>
              </li>
              <li>
                <span className="gotur-btn">{tour.price}</span>
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
                  <h4 className="tour-listing-details__sidebar__title">Book This Tour</h4>
                  <div className="sidebar-two__form">
                    <form className="sidebar-two__form__inner contact-form-validated" onSubmit={handleSubmit}>
                      <div className="sidebar-two__form__control ">
                        <label htmlFor="checkin">From:</label>
                        <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} />
                        <i className="icon-calendar"></i>
                      </div>
                      <div className="sidebar-two__form__control">
                        <label htmlFor="checkout">Time:</label>
                        <DatePicker selected={startTime} onChange={(date) => setStartTime(date)} />
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
                        <label className="sidebar-two__form__control--title" htmlFor="guests">
                          Add Extra:
                        </label>
                        <ul className="list-unstyled sidebar-two__form__checkbox">
                          <li>
                            <input type="checkbox" name="check8" id="check8" onChange={handleCheckboxChange} />
                            <label htmlFor="check8">
                              {" "}
                              <span> Services per booking</span>
                            </label>
                          </li>
                          <li>
                            <input type="checkbox" name="check9" id="check9" onChange={handleCheckboxChange} />
                            <label htmlFor="check9">
                              <span>Services per person</span>
                            </label>
                          </li>
                        </ul>
                      </div>
                      <button
                        type="submit"
                        className="gotur-btn gotur-btn--base"
                        onClick={() => window.open("https://wa.me/917732957732?text=Hello%20I%20want%20to%20book%20a%20tour", "_blank")}
                      >
                        Book Now <i className="icon-right"></i>
                      </button>
                    </form>
                  </div>
                </div>

                {tour.map_embed_url && (
                  <div
                    className="tour-listing-details__sidebar__item tour-listing-details__sidebar__item-location wow fadeInUp animated"
                    data-wow-delay="0.4s"
                    data-wow-duration="1500ms"
                  >
                    <div className="tour-listing-details__sidebar__item-box">
                      <iframe title="Google Map" src={tour.map_embed_url} allowFullScreen className="w-100" height="300" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-8">
              <div className="tour-listing-details__content">
                {tour.overview && (
                  <div
                    className="tour-listing-details__content__item tour-listing-details__content__text wow fadeInUp animated"
                    data-wow-duration="1500ms"
                    data-wow-delay="500ms"
                  >
                    <h4 className="tour-listing-details__title">Overview</h4>
                    {tour.overview.split(/\n\s*\n/).map((text, i) => (
                      <p key={i} className="tour-listing-details__text">{text.trim()}</p>
                    ))}
                  </div>
                )}

                {/* Highlight List Section */}
                {tour.highlights.length > 0 && (
                  <div
                    className="tour-listing-details__content__item tour-listing-details__list wow fadeInUp"
                    data-wow-duration="1500ms"
                    data-wow-delay="500ms"
                  >
                    <h4 className="tour-listing-details__title">Highlight List</h4>
                    <ul className="tour-listing-details__content__list">
                      {tour.highlights.map((item, index) => (
                        <li key={index}>
                          <i className="icon-check-star"></i> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tour Amenities Section */}
                {(tour.included.length > 0 || tour.excluded.length > 0) && (
                  <div
                    className="tour-listing-details__content__item tour-listing-details__amenities wow fadeInUp"
                    data-wow-duration="1500ms"
                    data-wow-delay="500ms"
                  >
                    <h4 className="tour-listing-details__title">Tour Amenities</h4>
                    <div className="tour-listing-details__amenities__inner">
                      <ul className="tour-listing-details__amenities__list">
                        {tour.included.map((amenity, index) => (
                          <li key={index}>
                            <i className="fas fa-check"></i> {amenity}
                          </li>
                        ))}
                      </ul>
                      <ul className="tour-listing-details__amenities__list tour-listing-details__amenities__list--two">
                        {tour.excluded.map((amenity, index) => (
                          <li key={index}>
                            <i className="fas fa-times"></i> {amenity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {tour.thumb_images.length > 0 && (
                  <div
                    className="tour-listing-details__content__item tour-listing-details__thumb wow fadeInUp animated"
                    data-wow-duration="1500ms"
                    data-wow-delay="500ms"
                  >
                    <div className="row gutter-y-30">
                      {tour.thumb_images.map((img, idx) => (
                        <div className="col-md-6" key={idx}>
                          <div className="destination-details__content__thumb__item">
                            <img src={img} alt={tour.title} width={"100%"} height={"100%"} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tour Plan */}
                {tour.faqs.length > 0 && (
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
                )}

                {/* Related Tours Section */}
                {tour.related.length > 0 && (
                  <div className="tour-listing-details__content__item tour-listing-details__ture-list">
                    <h4 className="tour-listing-details__title">Related Tour List</h4>
                    <PhotoSwipeGallery>
                      <div className="row">
                        {tour.related.map((item) => (
                          <Col lg={6} md={6} key={item.slug}>
                            <TourCard
                              tour={item}
                              onVideo={(id) => {
                                setVideoId(id);
                                setOpen(true);
                              }}
                            />
                          </Col>
                        ))}
                      </div>
                    </PhotoSwipeGallery>
                  </div>
                )}

                {/* Approved reviews */}
                <div className="tour-listing-details__content__item tour-listing-details__reviews" id="reviews">
                  <h3
                    className="tour-listing-details__title wow fadeInUp animated "
                    data-wow-duration="1500ms"
                    data-wow-delay="500ms"
                  >
                    {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
                  </h3>
                  {reviews.length === 0 && <p>No reviews yet. Be the first to share your experience.</p>}
                  <ul className="list-unstyled product-details__comment__list">
                    {reviews.map((review, index) => (
                      <li key={index} className="product-details__comment__card">
                        <div className="product-details__comment__card__image">
                          <span className="comments-one__avatar" aria-hidden="true">
                            {review.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="product-details__comment__card__content">
                          <div className="product-details__comment__card__top">
                            <div className="product-details__comment__card__info">
                              <h3 className="product-details__comment__card__title">{review.name}</h3>
                              <p className="product-details__comment__card__date">{blogDate(review.created_at).full}</p>
                            </div>
                            <div className="product-details__comment__card__star" aria-label={`${review.rating} out of 5 stars`}>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <span key={n} className={n <= review.rating ? "fa fa-star" : "far fa-star"}></span>
                              ))}
                            </div>
                          </div>
                          <p className="product-details__comment__card__text">{review.message}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="tour-listing-details__content__item tour-listing-details__add-reviews">
                  <div className="contact-page__contact">
                    <h2 className="tour-listing-details__title">Add a Review</h2>
                    <div className="product-details__form-ratings" role="radiogroup" aria-label="Your rating">
                      <p className="product-details__form-ratings__label">
                        Your Rating<span className="form-one__required">*</span>
                      </p>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={rating === n}
                          aria-label={`${n} star${n > 1 ? "s" : ""}`}
                          className="tour-review__star"
                          onClick={() => setRating(n)}
                        >
                          <span className={n <= rating ? "fa fa-star" : "far fa-star"}></span>
                        </button>
                      ))}
                    </div>
                    <form
                      className="comments-form__form product-details__form__form form-one"
                      onSubmit={handleReview}
                    >
                      <div className="form-one__group">
                        <div className="form-one__control">
                          <label htmlFor="name">Name<span className="form-one__required">*</span></label>
                          <input type="text" name="name" id="name" placeholder="Name" required maxLength={100} />
                        </div>
                        <div className="form-one__control">
                          <label htmlFor="email">Email<span className="form-one__required">*</span></label>
                          <input type="email" name="email" id="email" placeholder="Email" required maxLength={200} />
                        </div>
                        <div className="form-one__control form-one__control--full">
                          <label htmlFor="message">Review<span className="form-one__required">*</span></label>
                          <textarea name="message" id="message" placeholder="Write your review . ." required maxLength={2000}></textarea>
                        </div>
                        <div className="form-one__control form-one__control--full">
                          <button type="submit" className="gotur-btn gotur-btn--base" disabled={sending}>
                            {sending ? "Sending..." : "Send Review"} <i className="icon-arrow-right"></i>
                          </button>
                          {result && (
                            <p
                              role={result.ok ? "status" : "alert"}
                              className={`form-one__result ${result.ok ? "form-one__result--ok" : "form-one__result--error"}`}
                            >
                              {result.text}
                            </p>
                          )}
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
      {copied && (
        <div className={`share-toast ${copied === "fail" ? "share-toast--error" : ""}`} role="status">
          {copied === "ok" ? "Link copied! Paste it anywhere to share this tour." : "Couldn't copy the link. Please copy it from the address bar."}
        </div>
      )}
    </>
  );
};

export default TourDetail;
