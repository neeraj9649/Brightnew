"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import Image from "next/image";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { featurePackageData } from "@/data/featureTwoData";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import Link from "next/link";

const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});

interface FeaturePackageItem {
  id: number;
  image: string;
  title: string;
  link: string;
  price: string;
  rating: number;
  reviews: number;
  videoId: string;
  discount: string;
  meta: Metadata[];
}
interface Metadata {
  id: number;
  title: string;
  icon: string;
}
interface FeatureTwoProps {
  extraClass?: string;
  id?: string;
  homeThree?: boolean;
}

const FeatureTwo: React.FC<FeatureTwoProps> = ({
  extraClass,
  id,
  homeThree,
}) => {
  const [isOpen, setOpen] = useState(false);
  const [videoId, setVideoId] = useState("");

  return (
    <>
      <section
        className={`feature-package feature-package--two ${
          extraClass ? extraClass : ""
        }`}
        id={id}
      >
        <div className='container'>
          <div className='feature-package__top'>
            <div className='row align-items-end'>
              <div className='col-lg-8'>
                <div className='sec-title'>
                  <h6 className='sec-title__tagline bw-split-in-right'>
                    <TextAnimation
                      text={featurePackageData.subtitle}
                      animationType='right'
                    />
                  </h6>
                  <h3 className='sec-title__title bw-split-in-left d-flex gap-2'>
                    {homeThree ? (
                      <>
                        <TextAnimation
                          text={featurePackageData.title2}
                          animationType='left'
                        />
                        <span>
                          <TextAnimation
                            text={featurePackageData.titleSpan2}
                            animationType='left'
                          />
                        </span>
                      </>
                    ) : (
                      <>
                        <TextAnimation
                          text={featurePackageData.title}
                          animationType='left'
                        />
                        <span>
                          <TextAnimation
                            text={featurePackageData.titleSpan}
                            animationType='left'
                          />
                        </span>
                      </>
                    )}
                  </h3>
                </div>
              </div>
              <div className='col-lg-4'>
                <div className='feature-package__bottom__nav'>
                  <button className='feature-package__carousel__nav--left'>
                    <span className='icon-arrow-left'></span>
                  </button>
                  <button className='feature-package__carousel__nav--right'>
                    <span className='icon-arrow-right'></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='container-fluid'>
          <div className='feature-package__inner'>
            <div className='feature-package__carousel gotur-owl__carousel gotur-owl__carousel--custom-nav gotur-owl__carousel--with-shadow owl-carousel owl-theme owl-loaded owl-drag'>
              <PhotoSwipeGallery >
                <TinySlider
                  settings={{
                    items: 1,
                    gutter: 30,
                    loop: false,
                    smartSpeed: 700,
                    nav: false,
                    dots: false,
                    autoplay: false,
                    controlsContainer: ".feature-package__bottom__nav",
                    responsive: {
                      0: { items: 1 },
                      576: { items: 2 },
                      768: { items: 2 },
                      992: { items: 3 },
                      1199: { items: 3 },
                      1500: { items: 4 },
                    },
                  }}
                >
                  {featurePackageData.items.map((item: FeaturePackageItem) => (
                    <div className='item' key={item.id}>
                      <div
                        className='listing-card-four wow fadeInUp'
                        data-wow-duration='1500ms'
                      >
                        <div className='listing-card-four__image'>
                          <img src={item.image} alt={item.title} width={100} height={100} />
                          <div className='listing-card-four__btn-group'>
                            {item.discount && (
                              <div className='listing-card-four__discount'>
                                -{item.discount}% off
                              </div>
                            )}
                            <div className='listing-card-four__featured'>
                              Featured
                            </div>
                          </div>
                          <div className='listing-card-four__btns'>
                            <Link href='#'>
                              <i className='far fa-heart'></i>
                            </Link>
                            <div className='listing-card-four__btns__hover'>
                              <Item
                                original={item.image}
                                thumbnail={item.image}
                                width='370'
                                height='220'
                              >
                                {({ ref, open }) => (
                                  <Link
                                    className='listing-card-four__popup card__popup'
                                    ref={ref}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      open(e);
                                    }}
                                    href='#'
                                  >
                                    <span className='icon-image'></span>
                                  </Link>
                                )}
                              </Item>

                              <Link
                                className='video-popup'
                                href='https://www.youtube.com/watch?v=0MuL8fd3pb8'
                                onClick={(e) => {
                                  e.preventDefault();
                                  setOpen(true);
                                  setVideoId(item.videoId);
                                }}
                              >
                                <span className='icon-video'></span>
                              </Link>
                            </div>
                          </div>
                          <ul className='listing-card-four__meta list-unstyled'>
                            {item.meta.map((meta: Metadata) => (
                              <li key={meta.id}>
                                <Link href='tour-listing-details-2'>
                                  {" "}
                                  <span className='listing-card-four__meta__icon'>
                                    {" "}
                                    <i className={meta.icon}></i>{" "}
                                  </span>
                                  {meta.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className='listing-card-four__content'>
                          <div className='listing-card-four__rating'>
                            <span>({item.reviews} Review)</span>
                            {[...Array(item.rating)].map((_, i) => (
                              <i key={i} className='icon-star'></i>
                            ))}
                          </div>
                          <h3 className='listing-card-four__title'>
                            <Link href={item.link}>{item.title}</Link>
                          </h3>

                          <div className='listing-card-four__content__btn'>
                            <div className='listing-card-four__price'>
                              <span className='listing-card-four__price__sub'>
                                Per Day
                              </span>
                              <span className='listing-card-four__price__number'>
                                {item.price}
                              </span>
                            </div>
                            <Link
                              href={item.link}
                              className='listing-card-four__btn gotur-btn'
                            >
                              Book Now{" "}
                              <span className='icon'>
                                <i className='icon-right'></i>{" "}
                              </span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </TinySlider>
              </PhotoSwipeGallery>
            </div>
          </div>
        </div>

        {/* Element Shapes */}
        {!homeThree && (
          <div className='feature-package__element'>
            <img src={featurePackageData.shape} alt='Element Shape' width={100} height={100} />
          </div>
        )}
      </section>
      <VideoModal isOpen={isOpen} setOpen={setOpen} id={videoId} />
    </>
  );
};

export default FeatureTwo;
