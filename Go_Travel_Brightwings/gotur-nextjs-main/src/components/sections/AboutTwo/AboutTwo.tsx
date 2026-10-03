"use client";

import { aboutTwoData } from "@/data/aboutTwoData";
import Image from "next/image";
import CountUp from "react-countup";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import ClientCarousel from "../ClientCarousel/ClientCarousel";
import { useInView } from "react-intersection-observer";
import Link from "next/link";

// Interface for Feature Items
interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface Author {
  image: string;
  name: string;
  desc: string;
}

// Interface for the Main About Data
interface AboutTwoData {
  title: string;
  description: string;
  aboutImage: string;
  aboutImageSmall: string;
  funFactIcon: string;
  funFactCount: number;
  funFactText: string;
  featureItems: FeatureItem[];
  author: Author;
  aboutElenemtOne: string;
  aboutElenemtTwo: string;
}
interface AboutTwoProps {
  cta?: boolean;
  extraClass?: string;
}
const AboutTwo: React.FC<AboutTwoProps> = ({ cta, extraClass }) => {
  const {
    title,
    description,
    aboutImage,
    aboutImageSmall,
    funFactIcon,
    funFactCount,
    funFactText,
    featureItems,
    author,
    aboutElenemtOne,
    aboutElenemtTwo,
  }: AboutTwoData = aboutTwoData;
  const { ref, inView } = useInView({
    threshold: 1.0,
    triggerOnce: false,
  });

  return (
    <section className={`about-two section-space ${extraClass}`} id='about'>
      <div className='container'>
        <div className='row gutter-y-40'>
          <div className='col-lg-6'>
            <div
              className='about-two__thumb wow fadeInLeft'
              data-wow-duration='1500ms'
              data-wow-delay='300ms'
            >
              <div className='about-two__thumb__item'>
                <img src={aboutImage} alt='About Us' width={360} height={120}/>
              </div>
              <div className='about-two__thumb__item-small'>
                <img src={aboutImageSmall} alt='About Us Small' width={250} height={120}/>
              </div>

              <div className='about-two__thumb__funfact'>
                <div className='about-two__thumb__funfact__icon'>
                  <i className={funFactIcon}></i>
                </div>
                <div className='about-two__thumb__funfact__content count-box'>
                  <h2 className='about-two__thumb__funfact__count' ref={ref}>
                    {inView && (
                      <CountUp start={0} end={funFactCount} duration={1.5} />
                    )}

                    <span>Years</span>
                  </h2>
                  <p className='about-two__thumb__funfact__text'>
                    {funFactText}
                  </p>
                </div>
              </div>
              <div className='about-two__thumb__item-element'>
                <img
                  src={aboutElenemtTwo}
                  alt='Element Two'
                  width={200}
                  height={200}
                />
              </div>
            </div>
          </div>

          <div className='col-lg-6'>
            <div className='about-two__right'>
              <div className='sec-title'>
                <h6 className='sec-title__tagline bw-split-in-right'>
                  <TextAnimation text='About company' animationType='right' />
                </h6>
                <h3 className='sec-title__title bw-split-in-left'>
                  {title.split("\n").map((word: string, index: number) => (
                    <TextAnimation
                      text={word}
                      animationType='left'
                      key={index}
                    />
                  ))}
                </h3>
              </div>

              <p
                className='about-two__top__text wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='300ms'
              >
                {description}
              </p>

              {/* Features */}
              <div className='about-two__feature'>
                <div className='row gutter-y-20 gutter-x-20'>
                  {featureItems.map((item: FeatureItem, index: number) => (
                    <div className='col-xl-6 col-lg-12 col-md-6' key={index}>
                      <div
                        className='about-two__feature-vestion wow fadeInUp'
                        data-wow-duration='1500ms'
                        data-wow-delay={`${300 + index * 100}ms`}
                      >
                        <div className='about-two__feature_icon'>
                          <i className={item.icon}></i>
                        </div>
                        <div className='about-two__feature-content'>
                          <h5 className='about-two__feature-title'>
                            {item.title}
                          </h5>
                          <p className='about-two__feature-text'>
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Button and Author */}
              <div
                className='about-two__button wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='300ms'
              >
                <Link
                  href='blog-details-left'
                  className='gotur-btn gotur-btn--primary'
                >
                  Discover More{" "}
                  <span className='icon'>
                    <i className='icon-right'></i>
                  </span>
                </Link>
                <div className='about-two__button__author'>
                  <div className='about-two__button__author__thumb'>
                    <img
                      src={author.image}
                      alt='author'
                      width={56}
                      height={56}
                    />
                  </div>
                  <div className='about-two__button__author__content'>
                    <h5 className='about-two__button__author__name'>
                      {author.name}
                    </h5>
                    <span className='about-two__button__author__dec'>
                      {author.desc}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Carousel Section */}

      <div className='about-two__element-one'>
        <img src={aboutElenemtOne} alt='Element One'  width={270} height={120}/>
      </div>

      <div className='about-two__element-two'>
        <img src={aboutElenemtTwo} alt='Element Two'  width={220} height={120}/>
      </div>
    </section>
  );
};

export default AboutTwo;
