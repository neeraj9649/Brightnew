// ContactPage.tsx
"use client";
import React from "react";
import { contactFormFields, googleMapUrl } from "@/data/contactData"; // Import the data

interface ContactFormField {
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "email" | "textarea";
}
const ContactPage: React.FC = () => {
  const formFields = contactFormFields as ContactFormField[];
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    console.log("Form Submitted:", data);
  };
  return (
    <section className='contact-page section-space-bottom'>
      <div className='container'>
        <div className='row gutter-y-30'>
          {/* Google Map Section */}
          <div
            className='col-lg-6 wow fadeInLeft'
            data-wow-duration='1500ms'
            data-wow-delay='300ms'
          >
            <div className='contact-page__map'>
              <div className='google-map'>
                <iframe
                  title='template google map'
                  src={googleMapUrl}
                  className='map'
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>

          {/* Contact Form Section */}
          <div
            className='col-lg-6 wow fadeInRight'
            data-wow-duration='1500ms'
            data-wow-delay='300ms'
          >
            <div className='contact-page__contact'>
              <h2 className='contact-page__title'>Ready to Get Started?</h2>
              <p className='contact-page__text'>
               Have questions or need assistance? Tourists can contact us anytime via Call and email – we’re here to help you plan your perfect Dubai trip!.
              </p>
              <form
                className='comments-form__form contact-form-validated form-one'
                onSubmit={handleSubmit}
              >
                <div className='form-one__group'>
                  {formFields.map((field, index) => (
                    <div
                      key={index}
                      className={`form-one__control ${
                        field.type === "textarea"
                          ? "form-one__control--full"
                          : ""
                      }`}
                    >
                      <label htmlFor={field.name}>{field.label}</label>
                      {field.type === "textarea" ? (
                        <textarea
                          name={field.name}
                          id={field.name}
                          placeholder={field.placeholder}
                        ></textarea>
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          id={field.name}
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}
                  <div className='form-one__control form-one__control--full'>
                    <a href="mailto:info@brightwingstravel.com" target="_blank" type='submit' className='gotur-btn main-header__btn'>
                      Send Message <i className='icon-arrow-right'></i>
                    </a>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactPage;
