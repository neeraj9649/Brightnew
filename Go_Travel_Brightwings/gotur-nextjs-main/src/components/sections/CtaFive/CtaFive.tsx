"use client";
import { funFacts, funFactSectionConfig } from "@/data/ctaFiveData";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

const CTAFive: React.FC = () => {
  const { ref, inView } = useInView({
    threshold: 1.0,
    triggerOnce: false,
  });

  return (
    <section className="cta-five section-space">
      <div className="cta-five__inner">
        <div
          className="cta-five__bg wow fadeInUp"
          data-wow-duration="1500ms"
          data-wow-delay="300ms"
          style={{
            backgroundImage: `url(${funFactSectionConfig.bgImage})`,
          }}
        />
        <div className="container">
          <div className="row justify-content-between align-items-center">
            <div className="col-lg-6">
              <div
                className="cta-five__funfact wow fadeInLeft"
                data-wow-duration="1500ms"
                data-wow-delay="400ms"
              >
                <ul className="cta-five__funfact__list list-unstyled">
                  {funFacts.map((fact, index) => (
                    <li key={index} className="cta-five__funfact__item">
                      <div className="cta-five__funfact__icon">
                        <i className={fact.iconClass}></i>
                      </div>
                      <div className="cta-five__funfact__content count-box">
                        <h3 className="cta-five__funfact__count" ref={ref}>
                          {inView && (
                            <CountUp
                              start={0}
                              end={fact.count}
                              duration={1.5}
                            />
                          )}

                          <span>{fact.suffix}</span>
                        </h3>
                        <p className="cta-five__funfact__text">{fact.label}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="col-lg-6">
              <div
                className="cta-five__shape wow fadeInRight"
                data-wow-duration="1500ms"
                data-wow-delay="400ms"
              >
                <img src={funFactSectionConfig.shapeImage} alt="cta shape" width={200} height={100}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTAFive;
