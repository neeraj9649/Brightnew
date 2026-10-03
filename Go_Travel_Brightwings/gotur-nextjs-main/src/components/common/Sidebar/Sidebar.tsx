"use client";

import Image from "next/image";
import sidebarData from "@/data/sidebardata";
import useStore from "@/store/useStore";
import Link from "next/link";
import MailchimpSubscribe from "react-mailchimp-subscribe";

const Sidebar: React.FC = () => {
  const { sideBarDrawerStatus, changeSideBarDrawerStatus } = useStore();

  return (
    <div
      className={`header-right-sidebar ${
        sideBarDrawerStatus ? "isActive" : ""
      }`}
    >
      <div
        className='header-right-sidebar__overlay'
        onClick={changeSideBarDrawerStatus}
      ></div>
      <div className='header-right-sidebar__content'>
        <span
          className='header-right-sidebar__close'
          onClick={changeSideBarDrawerStatus}
        >
          <i className='fa fa-times'></i>
        </span>

        {/* Logo Box with Image */}
        <div className='header-right-sidebar__logo-box'>
          <Link href='/' aria-label='logo image'>
            {/* Using Next.js Image component for optimized loading */}
            <img src={sidebarData.logo} width={158} height={50} alt='logo' />
          </Link>
        </div>

        <div className='header-right-sidebar__container'>
          <div className='header-right-sidebar__container__about'>
            <h3 className='header-right-sidebar__container__title'>
              {sidebarData.subtitle}
            </h3>
            <p className='header-right-sidebar__container__text'>
              {sidebarData.description}
            </p>
          </div>

          <div className='header-right-sidebar__container__contact'>
            <h3 className='header-right-sidebar__container__title'>
              Contact Us
            </h3>
            <ul className='header-right-sidebar__container__list list-unstyled'>
              {sidebarData.contactItems.map((item, index) => (
                <li
                  key={index}
                  className='header-right-sidebar__container__list__item'
                >
                  <div className='header-right-sidebar__container__icon'>
                    <i className={item.icon}></i>
                  </div>
                  <div className='header-right-sidebar__container__list__content'>
                    <span className='header-right-sidebar__container__list__title'>
                      {item.title}
                    </span>
                    {item.href ? (
                      <Link href={item.href}>{item.content}</Link>
                    ) : (
                      <p>{item.content}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className='header-right-sidebar__container__newsletter-box'>
            <h3 className='header-right-sidebar__container__title'>
              Get Notification
            </h3>
            <MailchimpSubscribe
              url={sidebarData.newsletterActionUrl}
              render={(props: any) => {
                const { subscribe, status, message } = props || {};
                return (
                  <div className='mc-form'>
                    <form
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
                      className='newsletter-box'
                    >
                      <input
                        type='email'
                        name='EMAIL'
                        placeholder='Email'
                        required
                      />
                      <button
                        type='submit'
                        className='gotur-btn gotur-btn--base'
                      >
                        Subscribe Now
                      </button>
                    </form>

                    <div className='mc-form__response'>
                      {" "}
                      {status === "sending" && <div>sending...</div>}
                      {status === "error" && (
                        <div dangerouslySetInnerHTML={{ __html: message }} />
                      )}
                      {status === "success" && <div>Subscribed !</div>}
                    </div>
                  </div>
                );
              }}
            />

            <div className='mc-form__response'></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
