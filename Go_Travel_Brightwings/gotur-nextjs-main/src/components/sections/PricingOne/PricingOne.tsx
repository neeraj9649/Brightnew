"use client";
import React, { useState } from "react";

import Image, { StaticImageData } from "next/image"; // Import Image from next/image
import { Container, Row, Col, Tab, Nav } from "react-bootstrap"; // Import Bootstrap components
import { pricingData } from "@/data/pricingOneData";
import Link from "next/link";
interface Plan {
  name: string;
  price: number;
  description: string;
  features: string[];
}

interface Plans {
  image: string;
  standard: Plan;
  professional: Plan;
  premium: Plan;
}

interface PricingData {
  monthlyPlans: Plans;
  yearlyPlans: Plans;
}

const PricingOne: React.FC = () => {
  const [key, setKey] = useState<string>("monthly"); // State to toggle between monthly and yearly
  const { monthlyPlans, yearlyPlans }: PricingData = pricingData;
  const [activeTab, setActiveTab] = useState<string>("monthly");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  return (
    <section className='pricing-one section-space-bottom'>
      <Container>
        <div className='pricing-one__main-tab-box tabs-box'>
          <div
            className='pricing-one__top wow fadeInLeft'
            data-wow-duration='1500ms'
            data-wow-delay='500ms'
          >
            <div className='pricing-one__content'>
              <h3 className='pricing-one__title'>Plans & Pricing</h3>
              <p className='pricing-one__text'>
                Whether your time-saving automation needs are large or small,
                we’re here to help you scale.
              </p>
            </div>
            <ul className='tab-buttons'>
              <li
                onClick={() => handleTabChange("monthly")}
                className={`tab-btn ${
                  activeTab === "monthly" ? "active-btn" : ""
                }`}
              >
                MONTHLY
              </li>
              <li
                onClick={() => handleTabChange("yearly")}
                className={`tab-btn ${
                  activeTab === "yearly" ? "active-btn" : ""
                }`}
              >
                YEARLY
              </li>
            </ul>
          </div>

          <div className='tabs-content'>
            <div
              className={`tab fadeInUp animated ${
                activeTab === "monthly" ? "active-tab" : ""
              }`}
              id='monthly'
            >
              <div className='pricing-one__inner'>
                <div className='pricing-one__row row'>
                  <div className='pricing-one__col-image'>
                    <div className='pricing-one__image'>
                      <Image src={monthlyPlans.image} alt='pricing' />
                    </div>
                  </div>
                  <div className='pricing-one__col-card'>
                    <div className='pricing-one__card'>
                      <h2 className='pricing-one__card__price'>
                        ${monthlyPlans.standard.price} <span>/month</span>
                      </h2>
                      <h3 className='pricing-one__card__title'>
                        {monthlyPlans.standard.name}
                      </h3>
                      <p className='pricing-one__card__text'>
                        {monthlyPlans.standard.description}
                      </p>
                      <ul className='pricing-one__card__list list-unstyled'>
                        {monthlyPlans.standard.features.map((feature, idx) => (
                          <li key={idx}>
                            <span className='pricing-one__card__list__icon'>
                              <i className='icon-mark'></i>
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href='contact'
                        className='gotur-btn gotur-btn--base pricing-one__card__btn'
                      >
                        Choose plan
                      </Link>
                    </div>
                  </div>
                  <div className='pricing-one__col-divider'>
                    <div className='pricing-one__col-divider__inner'></div>
                  </div>
                  <div className='pricing-one__col-card'>
                    <div className='pricing-one__card'>
                      <h2 className='pricing-one__card__price'>
                        ${monthlyPlans.professional.price} <span>/month</span>
                      </h2>
                      <h3 className='pricing-one__card__title'>
                        {monthlyPlans.professional.name}
                      </h3>
                      <p className='pricing-one__card__text'>
                        {monthlyPlans.professional.description}
                      </p>
                      <ul className='pricing-one__card__list list-unstyled'>
                        {monthlyPlans.professional.features.map(
                          (feature, idx) => (
                            <li key={idx}>
                              <span className='pricing-one__card__list__icon'>
                                <i className='icon-mark'></i>
                              </span>
                              {feature}
                            </li>
                          )
                        )}
                      </ul>
                      <Link
                        href='contact'
                        className='gotur-btn gotur-btn--base pricing-one__card__btn'
                      >
                        Choose plan
                      </Link>
                    </div>
                  </div>
                  <div className='pricing-one__col-card pricing-one__col-card--popular'>
                    <div className='pricing-one__card pricing-one__card--popular'>
                      <div className='pricing-one__card__category'>
                        MOST POPULAR
                      </div>
                      <h2 className='pricing-one__card__price'>
                        ${monthlyPlans.premium.price} <span>/month</span>
                      </h2>
                      <h3 className='pricing-one__card__title'>
                        {monthlyPlans.premium.name}
                      </h3>
                      <p className='pricing-one__card__text'>
                        {monthlyPlans.premium.description}
                      </p>
                      <ul className='pricing-one__card__list list-unstyled'>
                        {monthlyPlans.premium.features.map((feature, idx) => (
                          <li key={idx}>
                            <span className='pricing-one__card__list__icon'>
                              <i className='icon-mark'></i>
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href='contact'
                        className='gotur-btn gotur-btn--base pricing-one__card__btn'
                      >
                        Choose plan
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`tab fadeInUp animated ${
                activeTab === "yearly" ? "active-tab" : ""
              }`}
              id='yearly'
            >
              <div className='pricing-one__inner'>
                <div className='pricing-one__row row'>
                  <div className='pricing-one__col-image'>
                    <div className='pricing-one__image'>
                      <Image src={yearlyPlans.image} alt='pricing' />
                    </div>
                  </div>
                  <div className='pricing-one__col-card'>
                    <div className='pricing-one__card'>
                      <h2 className='pricing-one__card__price'>
                        ${yearlyPlans.standard.price} <span>/month</span>
                      </h2>
                      <h3 className='pricing-one__card__title'>
                        {yearlyPlans.standard.name}
                      </h3>
                      <p className='pricing-one__card__text'>
                        {yearlyPlans.standard.description}
                      </p>
                      <ul className='pricing-one__card__list list-unstyled'>
                        {yearlyPlans.standard.features.map((feature, idx) => (
                          <li key={idx}>
                            <span className='pricing-one__card__list__icon'>
                              <i className='icon-mark'></i>
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href='contact'
                        className='gotur-btn gotur-btn--base pricing-one__card__btn'
                      >
                        Choose plan
                      </Link>
                    </div>
                  </div>
                  <div className='pricing-one__col-divider'>
                    <div className='pricing-one__col-divider__inner'></div>
                  </div>
                  <div className='pricing-one__col-card'>
                    <div className='pricing-one__card'>
                      <h2 className='pricing-one__card__price'>
                        ${yearlyPlans.professional.price} <span>/month</span>
                      </h2>
                      <h3 className='pricing-one__card__title'>
                        {yearlyPlans.professional.name}
                      </h3>
                      <p className='pricing-one__card__text'>
                        {yearlyPlans.professional.description}
                      </p>
                      <ul className='pricing-one__card__list list-unstyled'>
                        {yearlyPlans.professional.features.map(
                          (feature, idx) => (
                            <li key={idx}>
                              <span className='pricing-one__card__list__icon'>
                                <i className='icon-mark'></i>
                              </span>
                              {feature}
                            </li>
                          )
                        )}
                      </ul>
                      <Link
                        href='contact'
                        className='gotur-btn gotur-btn--base pricing-one__card__btn'
                      >
                        Choose plan
                      </Link>
                    </div>
                  </div>
                  <div className='pricing-one__col-card pricing-one__col-card--popular'>
                    <div className='pricing-one__card pricing-one__card--popular'>
                      <div className='pricing-one__card__category'>
                        MOST POPULAR
                      </div>
                      <h2 className='pricing-one__card__price'>
                        ${yearlyPlans.premium.price} <span>/month</span>
                      </h2>
                      <h3 className='pricing-one__card__title'>
                        {yearlyPlans.premium.name}
                      </h3>
                      <p className='pricing-one__card__text'>
                        {yearlyPlans.premium.description}
                      </p>
                      <ul className='pricing-one__card__list list-unstyled'>
                        {yearlyPlans.premium.features.map((feature, idx) => (
                          <li key={idx}>
                            <span className='pricing-one__card__list__icon'>
                              <i className='icon-mark'></i>
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href='contact'
                        className='gotur-btn gotur-btn--base pricing-one__card__btn'
                      >
                        Choose plan
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default PricingOne;
