import React from "react";
import Image from "next/image";
import {
  destinationsData,
  sectionTitle,
  Destination,
} from "@/data/destinationData";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import Link from "next/link";

const PopularDestinations: React.FC = () => {
  return (
    <section className='popular-destination section-space' id='destination'>
      <div className='container'>
        <div className='sec-title text-center'>
          <h6 className='sec-title__tagline bw-split-in-right'>
            <TextAnimation text={sectionTitle.tagline} animationType='right' />
          </h6>
          <h3 className='sec-title__title bw-split-in-left d-flex gap-2 justify-content-center'>
            <TextAnimation text={sectionTitle.title} animationType='left' />
            <span>
              <TextAnimation
                text={sectionTitle.highlight}
                animationType='left'
              />
            </span>
          </h3>
        </div>

        <div className='row gx-3 gy-3'>
          {destinationsData.map((dest: Destination) => (
            <div key={dest.id} className='col-xl-3 col-lg-4 col-md-4 col-sm-6'>
              <div
                className='destinations-card wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay={dest.delay}
              >
                <div className='destinations-card__thumb'>
                  <Image
                    src={dest.image}
                    alt={`${dest.title} image`}
                    className='img-fluid'
                    placeholder='blur'
                    layout='responsive'
                    sizes='(max-width: 768px) 100vw, 25vw'
                  />
                  <div className='destinations-card__group-card'>
                    <p className='destinations-card__group-card__text'>
                      {dest.tours}
                    </p>
                    <p className='destinations-card__group-card__text'>
                      {dest.hotels}
                    </p>
                  </div>
                </div>
                <h4 className='destinations-card__title'>
                  <Link href='destination-details'>{dest.title}</Link>
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='popular-destination__element'>
        <Image src={sectionTitle.shape} alt='decoration shape' />
      </div>
    </section>
  );
};

export default PopularDestinations;
