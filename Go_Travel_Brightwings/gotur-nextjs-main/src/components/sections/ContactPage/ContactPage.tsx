// ContactPage.tsx
"use client";
import React, { useState } from "react";
import { contactPageFormFields, googleMapUrl } from "@/data/contactData"; // Import the data
import { submitEnquiry } from "@/lib/api";

interface ContactFormField {
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "email" | "tel" | "textarea";
  full?: boolean;
}

// Shows a trailing "*" in red so required fields stand out.
const FieldLabel: React.FC<{ htmlFor: string; text: string }> = ({ htmlFor, text }) => {
  const required = text.endsWith("*");
  return (
    <label htmlFor={htmlFor}>
      {required ? text.slice(0, -1) : text}
      {required && <span className='form-one__required'>*</span>}
    </label>
  );
};
const ContactPage: React.FC = () => {
  const formFields = contactPageFormFields as ContactFormField[];
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  // Sends the form to the API, which saves it and e-mails it to info@brightwingstravel.in.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const form = e.currentTarget;
    const value = (name: string) => String(new FormData(form).get(name) ?? "").trim();

    setSending(true);
    setResult(null);
    try {
      await submitEnquiry({
        name: value("name"),
        email: value("email"),
        phone: value("phone"),
        message: value("message"),
        source: "contact",
        page_url: window.location.href,
        website: value("website"),
      });
      form.reset();
      setResult({ ok: true, text: "Thank you! Your message has been sent. We'll get back to you soon." });
    } catch (err) {
      setResult({
        ok: false,
        text: err instanceof Error ? err.message : "We couldn't send your message. Please try again or call us.",
      });
    } finally {
      setSending(false);
    }
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
                        field.type === "textarea" || field.full
                          ? "form-one__control--full"
                          : ""
                      }`}
                    >
                      <FieldLabel htmlFor={field.name} text={field.label} />
                      {field.type === "textarea" ? (
                        <textarea
                          name={field.name}
                          id={field.name}
                          placeholder={field.placeholder}
                          required
                          maxLength={5000}
                        ></textarea>
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          id={field.name}
                          placeholder={field.placeholder}
                          required
                          maxLength={field.type === "tel" ? 20 : field.type === "email" ? 200 : 100}
                          inputMode={field.type === "tel" ? "tel" : undefined}
                        />
                      )}
                    </div>
                  ))}
                  {/* Honeypot: hidden from people, bots fill it in and get ignored by the API. */}
                  <div className='form-one__honeypot' aria-hidden='true'>
                    <label htmlFor='website'>Website</label>
                    <input type='text' name='website' id='website' tabIndex={-1} autoComplete='off' />
                  </div>
                  <div className='form-one__control form-one__control--full'>
                    <button type='submit' className='gotur-btn main-header__btn' disabled={sending}>
                      {sending ? "Sending..." : "Send Message"} <i className='icon-arrow-right'></i>
                    </button>
                    {result && (
                      <p
                        role={result.ok ? "status" : "alert"}
                        className={`form-one__result ${result.ok ? "form-one__result--ok" : "form-one__result--error"}`}
                      >
                        {result.text}
                      </p>
                    )}
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
