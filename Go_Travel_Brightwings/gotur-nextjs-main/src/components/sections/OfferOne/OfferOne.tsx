"use client";

import React from "react";
import { useEffect, useState } from "react";
import { offerOneData } from "@/data/offerOneData";
import { Col, Container, Row } from "react-bootstrap";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import Link from "next/link";
import { getPublicOffers, type PublicOffer } from "@/lib/api";

const RESOURCE_BASE = (
  process.env.NEXT_PUBLIC_RESOURCE_URL ?? "https://resource.brightwingstravel.in"
).replace(/\/$/, "");

const imageFor = (offer: PublicOffer, index: number) =>
  offer.image_file_id
    ? `${RESOURCE_BASE}/file.php?id=${encodeURIComponent(offer.image_file_id)}`
    : offerOneData.offers[index % offerOneData.offers.length].image;

interface OfferOneProps {
  homeThree?: boolean;
}

const OfferOne: React.FC<OfferOneProps> = ({ homeThree }) => {
  const { sectionTagline, sectionTitle, element } = offerOneData;
  const [offers, setOffers] = useState<PublicOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getPublicOffers()
      .then((liveOffers) => {
        if (mounted) setOffers(liveOffers);
      })
      .catch(() => {
        if (mounted) setOffers([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // The section is driven by the admin-managed feed. Do not render stale
  // template offers when there are no live offers in the database.
  if (loading || !offers.length) return null;

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
          {offers.map((offer, index) => {
            const alignment = index % 2 === 0 ? "left" : "right";
            const titleLines = offer.title.split("\n");
            return (
            <Col
              lg={6}
              className='wow fadeInUp'
              data-wow-duration='1500ms'
              data-wow-delay={`${300 + index * 200}ms`}
              key={offer.id}
            >
              <div
                className={`offer-one__card ${
                  alignment === "right" ? "offer-one__card--two" : ""
                }`}
              >
                {alignment === "left" && (
                  <div className='offer-one__card__left'>
                    <div className='offer-one__card__thumb'>
                      <img src={imageFor(offer, index)} alt={offer.title} width={100} height={100}/>
                    </div>
                  </div>
                )}

                <div
                  className={`offer-one__card__content ${
                    alignment === "right" ? "text-end" : ""
                  }`}
                >
                  <div className='sec-title'>
                    <h6 className='sec-title__tagline bw-split-in-right'>
                      <TextAnimation
                        text={offer.badge || "Special offer"}
                        animationType='right'
                      />
                    </h6>
                    <h3 className='sec-title__title bw-split-in-left'>
                      {titleLines.map((line, lineIndex) => <TextAnimation key={`${offer.id}-${lineIndex}`} text={line} animationType='left' />)}
                    </h3>
                    {offer.description && <p style={{ color: "rgba(255,255,255,.82)", margin: "12px 0 0", maxWidth: 310 }}>{offer.description}</p>}
                    {offer.code && <small style={{ color: "rgba(255,255,255,.82)", display: "block", marginTop: 8 }}>Use code: <strong>{offer.code}</strong></small>}
                  </div>

                  <div className='offer-one__card__btn'>
                    <Link
                      href='/login'
                      className={`gotur-btn ${
                        alignment === "right"
                          ? "gotur-btn--primary"
                          : ""
                      }`}
                    >
                      Request this offer{" "}
                      <span className='icon'>
                        <i className='icon-right'></i>
                      </span>
                    </Link>
                  </div>
                </div>

                {alignment === "right" && (
                  <div className='offer-one__card__left'>
                    <div className='offer-one__card__thumb'>
                      <img src={imageFor(offer, index)} alt={offer.title} width={100} height={100}/>
                    </div>
                  </div>
                )}
              </div>
            </Col>
            );
          })}
        </Row>
      </Container>

      <div className='offer-one__element'>
        <img src={element} alt='' width={100} height={100}/>
      </div>
    </section>
  );
};

export default OfferOne;
