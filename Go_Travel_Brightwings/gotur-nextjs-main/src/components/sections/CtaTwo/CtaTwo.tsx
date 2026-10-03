"use client";

import Image from "next/image";
import ctaTwoData from "@/data/ctaTwoData";
import useCountdown from "@/hooks/useCountDown";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface CtaTwoContent {
  tagline: string;
  title: string;
  buttonText: string;
  buttonLink: string;
  bgImage: string;
  ctaMan: string;
  ctaPopup: string;
  ctaShape: string;
}
const CtaTwo = () => {
  const targetDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 31);
    return date;
  }, []);
  const { days, hours, minutes, seconds } = useCountdown(targetDate);
  const [clientOnly, setClientOnly] = useState(false);

  useEffect(() => {
    setClientOnly(true);
  }, []);

  const {
    tagline,
    title,
    buttonText,
    buttonLink,
    bgImage,
    ctaMan,
    ctaPopup,
    ctaShape,
  }: CtaTwoContent = ctaTwoData;

  return (
    <section className='cta-two position-relative'>
      <div
        className='cta-two__bg wow fadeInUp'
        data-wow-duration='1500ms'
        data-wow-delay='300ms'
        style={{
          backgroundImage: `url(${bgImage})`,
        }}
      />

      <div className='container'>
        <div className='row justify-content-between align-items-center'>
          <div className='col-lg-6'></div>
          <div className='col-lg-6'>
            <div
              className='cta-two__content wow fadeInRight'
              data-wow-duration='1500ms'
              data-wow-delay='400ms'
            >
              <div className='cta-two__content__inner text-center'>
                <div className='sec-title'>
                  <h6 className='sec-title__tagline bw-split-in-right'>
                    <TextAnimation text={tagline} animationType='right' />
                  </h6>
                  <h3 className='sec-title__title bw-split-in-left'>
                    <TextAnimation text={title} animationType='left' />
                  </h3>
                </div>

                <div className='time-wepper'>
                  {[
                    { label: "DAYS", value: days },
                    { label: "HRS", value: hours },
                    { label: "MINS", value: minutes },
                    { label: "SECS", value: seconds },
                  ].map((unit, idx) => (
                    <div
                      key={idx}
                      className='time-wepper__item day text-center'
                      style={{ minWidth: "70px" }}
                    >
                      {clientOnly && <h4 id='hours'>{unit.value}</h4>}
                      <span className='time-wepper__item__text'>
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className='cta-two__btn'>
                  <Link href={buttonLink} className='gotur-btn gotur-btn--base'>
                    {buttonText}
                    <span className='icon'>
                      <i className='icon-right'></i>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Images */}
      <div
        className='cta-two__thumb wow fadeInLeft'
        data-wow-duration='1500ms'
        data-wow-delay='400ms'
      >
        <div className='cta-two__thumb__item'>
          <Image src={ctaMan} alt='cta man' width={410} height={100} />
        </div>
        <div className='cta-two__thumb__popup'>
          <Image src={ctaPopup} alt='cta popup' width={200} height={300} />
        </div>
        <div className='cta-two__thumb__element' />
      </div>

      <div className='cta-two__element'>
        <Image src={ctaShape} alt='cta shape' width={200} height={100} />
      </div>
    </section>
  );
};

export default CtaTwo;
