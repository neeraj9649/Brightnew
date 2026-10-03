"use client";

import { destinationFilterData } from "@/data/destinationFilterData";
import Image from "next/image";
import { useState } from "react";
// import { StaticImageData } from "next/image";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";

// Interface for each Destination Item
interface DestinationItem {
  id: number;
  image: string;
  title: string;
  link: string;
}

const DestinationFilter: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Dubai");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <section className="destination-filter section-space" id="destination">
      <Container>
        <div className="destination-filter__top">
          <div className="sec-title text-center">
            <h6 className="sec-title__tagline bw-split-in-right">
              <TextAnimation
                text={destinationFilterData.subtitle}
                animationType="right"
              />
            </h6>
            <h3 className="sec-title__title bw-split-in-left d-flex justify-content-center gap-2">
              <TextAnimation
                text={destinationFilterData.title}
                animationType="left"
              />
              <span>
                <TextAnimation
                  text={destinationFilterData.titleSpan}
                  animationType="left"
                />
              </span>
            </h3>
          </div>
          <p className="destination-filter__top__text">
            {destinationFilterData.description}
          </p>
        </div>

        <div className="tabs-box">
          <div className="destination-filter__btn tab-buttons">
            <button
              onClick={() => handleTabChange("Dubai")}
              className={`tab-btn gotur-btn ${
                activeTab === "Dubai" ? "active-btn" : ""
              }`}
            >
              Dubai
            </button>
            {/* <button
              onClick={() => handleTabChange("Thailand")}
              className={`tab-btn gotur-btn ${
                activeTab === "Thailand" ? "active-btn" : ""
              }`}
            >
              Thailand
            </button>
            <button
              onClick={() => handleTabChange("Africa")}
              className={`tab-btn gotur-btn ${
                activeTab === "Africa" ? "active-btn" : ""
              }`}
            >
              Africa
            </button>
            <button
              onClick={() => handleTabChange("SouthAmerica")}
              className={`tab-btn gotur-btn ${
                activeTab === "South America" ? "active-btn" : ""
              }`}
            >
              South America
            </button>
            <button
              onClick={() => handleTabChange("Australia")}
              className={`tab-btn gotur-btn ${
                activeTab === "Australia" ? "active-btn" : ""
              }`}
            >
              Australia
            </button> */}
          </div>

          <div className="tabs-content">
            <div className="item tab active-tab">
              <Row className=" gutter-y-20 gutter-x-20">
                {/* Render all tab contents */}
                {Object.keys(destinationFilterData.items).map((tabKey) => (
                  <div
                    key={tabKey}
                    className={`outter_image_section item tab fadeInUp animated  ${
                      activeTab === tabKey ? "active-tab" : ""
                    }`}
                  >
                    <div className="popular_destination_cards  ">
                      {destinationFilterData.items[tabKey].map(
                        (item: DestinationItem) => (
                          // <Col xl={3} lg={4} md={4} sm={6} key={item.id}>
                          <Col key={item.id}>
                            <div
                              className="destination-card-one wow fadeInUp"
                              data-wow-duration="1500ms"
                              data-wow-delay="100ms"
                            >
                              <div className="destination-card-one__thumb">
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  width={100}
                                  height={100}
                                />
                                <Link
                                  href={item.link}
                                  className="destination-card-one__overly"
                                ></Link>
                              </div>
                              <div className="destination-card-one__content">
                                <h3 className="destination-card-one__title">
                                  <Link href={item.link}>{item.title}</Link>
                                </h3>
                              </div>
                            </div>
                          </Col>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </Row>
            </div>
          </div>
        </div>
      </Container>

      {/* Element Shapes */}
      <div className="destination-filter__element">
        <img
          src={destinationFilterData.plan}
          alt="Shape Plan"
          width={50}
          height={100}
        />
      </div>
      <div className="destination-filter__element-two">
        <img
          src={destinationFilterData.monjil}
          alt="Shape Monjil"
          width={1600}
          height={533}
        />
      </div>
    </section>
  );
};

export default DestinationFilter;
