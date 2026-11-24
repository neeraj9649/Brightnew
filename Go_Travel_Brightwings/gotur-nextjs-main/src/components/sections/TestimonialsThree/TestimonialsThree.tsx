"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { testimonialsThreeData } from "@/data/testimonialsThreeData";
import { getAllTourReviews } from "@/lib/api";
const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});

// Home page testimonials: reviews visitors left on tour pages, shown once an admin approves them.
// Background and photo still come from testimonialsThreeData.
const TestimonialsThree: React.FC = () => {
  const { bgImage, thumb } = testimonialsThreeData;
  const [reviews, setReviews] = useState<{ name: string; message: string }[] | null>(null);
  useEffect(() => {
    getAllTourReviews(20, 0).then((p) => setReviews(p.items)).catch(() => setReviews([]));
  }, []);

  // The section always shows. With no approved reviews yet (or the API unreachable) one card invites a review.
  const shown = reviews === null ? null : reviews.length ? reviews : [{
    name: "Be the first to review",
    message: "Travelled with Bright Wings? Open your tour from the Tours page and share your experience. Approved reviews appear here.",
  }];

  return (
    <section
      className="testimonials-three testimonials-three--two "
      id="testimonials"
    >
      <div
        className="testimonials-three__bg"
        style={{ backgroundImage: `url(${bgImage})` }}
      ></div>

      <div className="container-fluid">
        <div className="row align-items-center gutter-y-40">
          <div className="col-xl-4">
            <div className="testimonials-three__top">
              <div
                className="testimonials-three__thumb wow fadeInLeft testimonial_img_box"
                data-wow-duration="1500ms"
                data-wow-delay="400ms"
              >
                <img src={thumb} alt="" height={'100%'} width={'100%'} className="testimonial_three_image"/>
                {/* <Image
                  src={thumb}
                  alt="testimonial image"
                  width={800}
                  height={700}
                  className="testimonial_img"
                  // fill
                  // priority
                  // style={{
                  //   width: "100%",
                  //   height: "auto",
                  //   objectFit: "cover",
                  // }}
                /> */}
              </div>

              <div className="testimonials-three__bottom__nav">
                <button className="testimonials-three__carousel__nav--left">
                  <span className="icon-arrow-left"></span>
                </button>
                <button className="testimonials-three__carousel__nav--right">
                  <span className="icon-arrow-right"></span>
                </button>
              </div>
            </div>
          </div>

          <div className="col-xl-8">
            <div className="testimonials-three__inner">
              {shown && (
              <TinySlider
                settings={{
                  items: 1,
                  gutter: 30,
                  loop: true,
                  mouseDrag: true,
                  nav: false,
                  autoplay: false,
                  controlsContainer: ".testimonials-three__bottom__nav",
                  responsive: {
                    0: { items: 1 },

                    768: { items: 2 },
                    992: { items: 2 },
                    1199: { items: 2 },
                  },
                }}
              >
                {shown.map((review, index) => (
                  <div key={index} className="item">
                    <div className="testimonials-two-card testimonials-two-card--two testimonials-two-card--text-only">
                      <div className="testimonials-two-card__inner">
                        <div className="testimonials-two-card__content testimonials-two-card__content--two">
                          <div className="testimonials-two-card__author">
                            <h4 className="testimonials-two-card__author__name">{review.name}</h4>
                          </div>
                          <p className="testimonials-two-card__text">{review.message}</p>
                        </div>
                        <div className="testimonials-two-card__quite">
                          <i className="icon-straight-quotes"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </TinySlider>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsThree;
