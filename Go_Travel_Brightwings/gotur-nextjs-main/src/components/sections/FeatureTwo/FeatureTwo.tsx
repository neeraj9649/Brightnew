"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { featurePackageData } from "@/data/featureTwoData";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import { Gallery as PhotoSwipeGallery } from "react-photoswipe-gallery";
import TourCard from "@/components/common/TourCard/TourCard";
import { getTours, type TourCardData } from "@/lib/api";

const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});

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
  // Tours the admin marked "Show on the home page".
  const [tours, setTours] = useState<TourCardData[]>([]);
  useEffect(() => {
    getTours(12, 0, true).then((p) => setTours(p.items)).catch(() => setTours([]));
  }, []);

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
                {tours.length > 0 && (
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
                  {tours.map((tour) => (
                    <div className='item' key={tour.slug}>
                      <TourCard
                        tour={tour}
                        onVideo={(id) => {
                          setVideoId(id);
                          setOpen(true);
                        }}
                      />
                    </div>
                  ))}
                </TinySlider>
                )}
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
