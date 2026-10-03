"use client";
import { useEffect, useRef, useState } from "react";
import { mainSliderOneData } from "@/data/mainSliderOneData";
import Image from "next/image";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import dynamic from "next/dynamic";
import BannerForm from "../BannerForm/BannerForm";

const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});
export interface MainSliderOneDataType {
  title: string;
  subtitle: string;
  hoverImage: string;
  description: string;
  destinations: DestinationItem[];
  formFields: FormField[];
  images: {
    id: number;
    class: string;
    image: string;
  }[];
}

interface DestinationItem {
  id: number;
  image: string;
}

interface FormField {
  id: number;
  name: string;
  label: string;
  icon: string;
  type: "select" | "text" | "number";
  placeholder?: string;
  value?: number;
  options?: FormFieldOption[];
}

interface FormFieldOption {
  id: number;
  value: string;
  label: string;
}
interface images {
  id: number;
  class: string;
  image: string;
}
const MainSliderOne: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }
  const settings = {
    loop: true,
    autoplay: true,
    items: 3,
    gutter: 40,
    mouseDrag: true,
    preventScrollOnTouch: "auto",
    nav: false,
    autoplayButtonOutput: false,
    controls: true,
    controlsContainer: ".main-slider-one__bottom__nav",
    // dots: true,
    autoplayTimeout: 6000,
    speed: 1000,
  };

  return (
    <section className='main-slider-one' id='home'>
      <div className='main-slider-one__item'>
        <div className='container'>
          <div className='row'>
            <div className='col-xl-7 col-lg-8 col-md-10'>
              <div className='main-slider-one__content'>
                <h5 className='main-slider-one__sub-title main-three bw-split-in-top'>
                  {mainSliderOneData.subtitle}
                </h5>

                <h2 className='main-slider-one__title main-three bw-split-in-down'>
                  <TextAnimation text='Next Step' animationType='down' />
                </h2>
                <h2 className='main-slider-one__title main-three bw-split-in-down'>
                  <TextAnimation text='Destination' animationType='down' />
                </h2>

                <p className='main-slider-one__text main-three bw-split-in-down'>
                  {mainSliderOneData.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='main-slider-one__destinations'>
          <div className='container'>
            <div className='destinations-two__inner gotur-owl__carousel--with-shadow'>
              {mounted && (
                <TinySlider
                  settings={settings}
                  className='main-slider-one__carousel'
                >
                  {mainSliderOneData?.destinations?.map(
                    (dest: DestinationItem) => (
                      <div className='item' key={dest.id}>
                        <div className='destinations-card-two wow fadeInUp'>
                          <div className='destinations-card-two__thumb'>
                            <img src={dest.image} alt='destination' width={400} height={400}/>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </TinySlider>
              )}
              {/* <div
                  className="destinations-two__carousel "
                  ref={sliderRef}
                >
                  {mainSliderOneData?.destinations?.map((dest: DestinationItem) => (
                    <div className="item" key={dest.id}>
                      <div className="destinations-card-two wow fadeInUp">
                        <div className="destinations-card-two__thumb">
                          <Image src={dest.image} alt="destination" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div> */}
            </div>
          </div>

          <div className='main-slider-one__destinations__hover'>
            <img src={mainSliderOneData.hoverImage} alt='hover image' width={700} height={100}/>
          </div>
        </div>

        <div className='main-slider-one__bottom__nav'>
          <button className='main-slider-one__carousel__nav--left'>
            <span className='icon-arrow-left'></span>
          </button>
          <button className='main-slider-one__carousel__nav--right'>
            <span className='icon-arrow-right'></span>
          </button>
        </div>

        <div className='main-slider-one__action-form'>
          <div className='container'>
            <div className='main-slider-one__form'>
              <BannerForm />
            </div>
          </div>
        </div>

        {/* Shape Images */}
        {mainSliderOneData?.images?.map((img: images) => (
          <div key={img.id} className={`main-slider-one__element${img.class}`}>
            <img src={img.image} alt={`element ${img.class}`} width={70} height={100}/>
          </div>
        ))}
        <div className={`main-slider-one__element-four`}></div>
      </div>
    </section>
  );
};

export default MainSliderOne;
