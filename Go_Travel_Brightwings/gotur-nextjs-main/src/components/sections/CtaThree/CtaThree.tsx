"use client";

import Image, { StaticImageData } from "next/image";
import ctaThreeData from "@/data/ctaThreeData";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import MailchimpSubscribe from "react-mailchimp-subscribe";

const url = "//xxxx.us13.list-manage.com/subscribe/post?u=zefzefzef&id=fnfgn";

interface CtaThreeContent {
  tagline: string;
  title: string;
  description: string;
  formPlaceholder: string;
  bgImage: string;
  phone1: string;
  phone2: string;
  phone3: string;
  shape1: string;
  shape2: string;
}

const CtaThree = () => {
  const {
    tagline,
    title,
    description,
    formPlaceholder,
    bgImage,
    phone1,
    phone2,
    phone3,
    shape1,
    shape2,
  }: CtaThreeContent = ctaThreeData;
  const [titleOne, titleTwo] = title.split("\n");

  return (
    <section className='cta-three position-relative'>
      <div
        className='cta-three__bg'
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      <div className='container-fluid'>
        <div className='cta-three__inner'>
          <div className='row'>
            <div className='col-lg-6'>
              <div className='cta-three__left'>
                <div className='sec-title'>
                  <h6 className='sec-title__tagline bw-split-in-right'>
                    <TextAnimation text={tagline} animationType='right' />
                  </h6>
                  <h3 className='sec-title__title bw-split-in-left'>
                    <TextAnimation text={titleOne} animationType='left' />
                    <TextAnimation text={titleTwo} animationType='left' />
                  </h3>
                </div>

                <p
                  className='cta-three__top__text wow fadeInLeft'
                  data-wow-duration='1500ms'
                  data-wow-delay='300ms'
                >
                  {description}
                </p>

                <div
                  className='cta-three__form wow fadeInLeft'
                  data-wow-duration='1500ms'
                  data-wow-delay='500ms'
                >
                  <MailchimpSubscribe
                    url={url}
                    render={(props: any) => {
                      const { subscribe, status, message } = props || {};
                      return (
                        <div className='mc-form'>
                          <form
                            className='footer-widget__newsletter mc-form'
                            onSubmit={(e) => {
                              e.preventDefault();
                              const form = e.currentTarget;
                              const emailInput = form.querySelector(
                                'input[name="EMAIL"]'
                              ) as HTMLInputElement;
                              if (emailInput && emailInput.value) {
                                subscribe({ EMAIL: emailInput.value });
                              }
                            }}
                          >
                            <div className='form-group__form d-flex align-items-center'>
                              <input
                                type='email'
                                name='EMAIL'
                                placeholder={formPlaceholder}
                                className='form-control'
                              />
                              <button type='submit' className='gotur-btn'>
                                <span className='icon-right-arrow'></span>
                              </button>
                            </div>
                          </form>

                          <div className='mc-form__response'>
                            {" "}
                            {status === "sending" && <div>sending...</div>}
                            {status === "error" && (
                              <div
                                dangerouslySetInnerHTML={{ __html: message }}
                              />
                            )}
                            {status === "success" && <div>Subscribed !</div>}
                          </div>
                        </div>
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className='cta-three__right'>
            <div className='cta-three__thumb'>
              <Image src={phone1} alt='cta phone 1' />
            </div>
            <div className='cta-three__thumb-one'>
              <Image src={phone2} alt='cta phone 2' />
            </div>
            <div className='cta-three__thumb-two'>
              <Image src={phone3} alt='cta phone 3' />
            </div>
          </div>

          <div className='cta-three__shape'>
            <Image src={shape1} alt='shape 1' />
          </div>
          <div className='cta-three__shape-two'>
            <Image src={shape2} alt='shape 2' />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaThree;
