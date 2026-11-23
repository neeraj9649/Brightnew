// ContactTop.tsx
import React from "react";
import Link from "next/link";
import { contactItems } from "@/data/contactTopData";

interface ContactItem {
  icon: string;
  title: string;
  text: string;
  link?: string;
  phones?: { label: string; href: string }[];
  lines?: { label: string; text: string }[];
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
                {item.phones ? (
                  <>
                    {item.phones.map((p) => (
                      <p className='contact-top__item__text' key={p.href} style={{ marginBottom: 6 }}>
                        <Link href={p.href}>
                          <strong>{p.label}</strong>
                        </Link>
                      </p>
                    ))}
                    <p className='contact-top__item__text' style={{ marginTop: 12 }}>{item.text}</p>
                  </>
                ) : item.lines ? (
                  item.lines.map((line, i) => (
                    <p
                      className='contact-top__item__text'
                      key={line.label}
                      style={{ marginBottom: i < item.lines!.length - 1 ? 12 : 0 }}
                    >
                      <strong>{line.label}:</strong> {line.text}
                    </p>
                  ))
                ) : (
                  <p className='contact-top__item__text'>{item.text}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactTop;
