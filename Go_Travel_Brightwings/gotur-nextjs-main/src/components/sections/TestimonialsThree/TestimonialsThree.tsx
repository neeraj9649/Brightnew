"use client";
import React from "react";
import dynamic from "next/dynamic";
import { testimonialsThreeData } from "@/data/testimonialsThreeData";
import Image from "next/image";
const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});

interface Testimonial {
  id: number;
  authorName: string;
  authorDesc: string;
  authorImage: string;
  text: string;
  rating: number;
}
interface TestimonialsThreeData {
  bgImage: string;
  cards: Testimonial[];
  thumb: string;
}

const TestimonialsThree: React.FC = () => {
  const { bgImage, cards, thumb }: TestimonialsThreeData =
    testimonialsThreeData;

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
          <div className="col-xl-6">
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

          <div className="col-xl-6">
            <div className="testimonials-three__inner">
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
                {cards.map((testimonial: Testimonial) => (
                  <div key={testimonial.id} className="item">
                    <div
                      className="testimonials-two-card testimonials-two-card--two wow fadeInUp"
                      data-wow-duration="1500ms"
                      data-wow-delay="00ms"
                    >
                      <div className="testimonials-two-card__inner">
                        <div className="testimonials-two-card__top">
                          <img
                            src={testimonial.authorImage}
                            alt="testiomonials author"
                            width={500}
                            height={400}
                          />
                        </div>
                        <div className="testimonials-two-card__content testimonials-two-card__content--two">
                          <div className="testimonials-two-card__author">
                            <h4 className="testimonials-two-card__author__name">
                              {testimonial.authorName}
                            </h4>
                            <p className="testimonials-two-card__author__dec">
                              {testimonial.authorDesc}
                            </p>
                          </div>
                          <p className="testimonials-two-card__text">
                            {testimonial.text}
                          </p>
                        </div>
                        <div className="testimonials-two-card__star testimonials-two-card__star--two">
                          <div className="testimonials-two-card__star__item">
                            {[...Array(testimonial.rating)].map((_, index) => (
                              <i key={index} className="icon-star"></i>
                            ))}
                          </div>
                        </div>
                        <div className="testimonials-two-card__quite">
                          <i className="icon-straight-quotes"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </TinySlider>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsThree;
