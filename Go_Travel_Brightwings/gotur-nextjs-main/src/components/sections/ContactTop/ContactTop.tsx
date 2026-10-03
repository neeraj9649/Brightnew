// ContactTop.tsx
import React from "react";
import Link from "next/link";
import { contactItems } from "@/data/contactTopData";

interface ContactItem {
  icon: string;
  title: string;
  text: string;
  link?: string;
}
const ContactTop: React.FC = () => {
  return (
    <section className='contact-top section-space'>
      <div className='container'>
        <div className='row gutter-y-30'>
          {contactItems.map((item: ContactItem, index) => (
            <div
              key={index}
              className='col-lg-4 col-md-6 wow fadeInUp'
              data-wow-duration='1500ms'
              data-wow-delay={`${300 + 200 * index}ms`}
            >
              <div className='contact-top__item'>
                <div className='contact-top__item__icon'>
                  <i className={item.icon}></i>
                </div>
                <h3 className='contact-top__item__title'>
                  {item.link ? (
                    <Link href={item.link} className="fs-5">{item.title}</Link>
                  ) : (
                    <p className="fs-5">{item.title}</p>
                    
                  )}
                </h3>
                <p className='contact-top__item__text'>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactTop;
