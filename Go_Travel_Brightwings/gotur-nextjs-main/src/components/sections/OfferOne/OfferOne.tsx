"use client";

import React from "react";
import Image, { StaticImageData } from "next/image";
import { offerOneData } from "@/data/offerOneData";
import { Col, Container, Row } from "react-bootstrap";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import Link from "next/link";

interface OfferCard {
  id: number;
  tagline: string;
  title: string;
  image: string;
  link: string;
  alignment: "left" | "right";
  buttonStyle?: "primary" | "default";
}

interface OfferOneData {
  sectionTagline: string;
  sectionTitle: string;
  element: string;
  offers: OfferCard[];
}

interface OfferOneProps {
  homeThree?: boolean;
}

const OfferOne: React.FC<OfferOneProps> = ({ homeThree }) => {
  const { sectionTagline, sectionTitle, offers, element }: OfferOneData =
    offerOneData;
  const [title, titleSpan] = sectionTitle.split("\n");
  return (
    <section className={`${homeThree ? "" : "section-space"} offer-one `}>
      <Container>
        {!homeThree && (
          <div className='sec-title text-center'>
            <h6 className='sec-title__tagline bw-split-in-right'>
              <TextAnimation text={sectionTagline} animationType='right' />
            </h6>
            <h3 className='sec-title__title item_title bw-split-in-left d-flex gap-2 justify-content-center'>
              <TextAnimation text={title} animationType='left' />
              <span>
                <TextAnimation text={titleSpan} animationType='left' />
              </span>
            </h3>
          </div>
        )}

        <Row className='gutter-y-30 gutter-x-30'>
          {offers.map((offer, index) => (
            <Col
              lg={6}
              className='wow fadeInUp'
              data-wow-duration='1500ms'
              data-wow-delay={`${300 + index * 200}ms`}
              key={offer.id}
            >
              <div
                className={`offer-one__card ${
                  offer.alignment === "right" ? "offer-one__card--two" : ""
                }`}
              >
                {offer.alignment === "left" && (
                  <div className='offer-one__card__left'>
                    <div className='offer-one__card__thumb'>
                      <img src={offer.image} alt={`offer-${offer.id}`} width={100} height={100}/>
                    </div>
                  </div>
                )}

                <div
                  className={`offer-one__card__content ${
                    offer.alignment === "right" ? "text-end" : ""
                  }`}
                >
                  <div className='sec-title'>
                    <h6 className='sec-title__tagline bw-split-in-right'>
                      <TextAnimation
                        text={offer.tagline}
                        animationType='right'
                      />
                    </h6>
                    <h3 className='sec-title__title bw-split-in-left'>
                      {(() => {
                        const [titleOne, titleTwo] = offer.title.split("\n");
                        return (
                          <>
                            <TextAnimation
                              text={titleOne}
                              animationType='left'
                            />

                            <TextAnimation
                              text={titleTwo}
                              animationType='left'
                            />
                          </>
                        );
                      })()}
                    </h3>
                  </div>

                  <div className='offer-one__card__btn'>
                    <Link
                      href={offer.link}
                      className={`gotur-btn ${
                        offer.buttonStyle === "primary"
                          ? "gotur-btn--primary"
                          : ""
                      }`}
                    >
                      Book Now{" "}
                      <span className='icon'>
                        <i className='icon-right'></i>
                      </span>
                    </Link>
                  </div>
                </div>

                {offer.alignment === "right" && (
                  <div className='offer-one__card__left'>
                    <div className='offer-one__card__thumb'>
                      <img src={offer.image} alt={`offer-${offer.id}`} width={100} height={100}/>
                    </div>
                  </div>
                )}
              </div>
            </Col>
          ))}
        </Row>
      </Container>

      <div className='offer-one__element'>
        <img src={element} alt='' width={100} height={100}/>
      </div>
    </section>
  );
};

export default OfferOne;
