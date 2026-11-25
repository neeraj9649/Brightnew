"use client";
import React, { FormEvent, useEffect, useState } from "react";
import { requestTourQuote } from "@/lib/api";

const pad = (n: number) => String(n).padStart(2, "0");
const dmy = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** What a tour booking can include. Must match BOOKING_INCLUDES in backend tours.rs. */
export const BOOKING_INCLUDES = [
  "Airport Pickup & Drop",
  "Private AC Cab for All Days",
  "Hindi/English Speaking Tour Guide",
];

export interface TourBooking {
  from: Date;
  to: Date;
  travellers: number;
  includes: string[]; // ticked BOOKING_INCLUDES, in that order
}

/** "5 Days, 4 Nights" (same day = "1 Day"). Days count both the first and the last day, like the API. */
export function tripLength(from: Date, to: Date): string {
  const nights = Math.max(0, Math.round((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / 86400000));
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  return nights === 0 ? plural(1, "Day") : `${plural(nights + 1, "Day")}, ${plural(nights, "Night")}`;
}

const FIELDS = [
  { name: "name", label: "Name", type: "text", placeholder: "Full name", autoComplete: "name", max: 100 },
  { name: "phone", label: "Phone No. / WhatsApp No.", type: "tel", placeholder: "Phone / WhatsApp No.", autoComplete: "tel", max: 20 },
  { name: "email", label: "Email", type: "email", placeholder: "Email", autoComplete: "email", max: 200 },
  { name: "departure_address", label: "Departure Address", type: "text", placeholder: "City, state, country you will travel from", autoComplete: "street-address", max: 300 },
] as const;
type Contact = Record<(typeof FIELDS)[number]["name"] | "message", string>;
const EMPTY: Contact = { name: "", email: "", phone: "", departure_address: "", message: "" };

/** Same rules as the API (tours.rs validate_booking), so a visitor sees the problem before anything is sent. */
function check(c: Contact): string {
  if (!c.name.trim()) return "Please enter your name.";
  const digits = c.phone.replace(/\D/g, "").length;
  if (!/^[0-9+()\s-]+$/.test(c.phone.trim()) || digits < 7 || digits > 15) return "Please enter a valid phone / WhatsApp number.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) return "Please enter a valid e-mail address.";
  if (!c.departure_address.trim()) return "Please enter your departure address.";
  return "";
}

/**
 * "Book This Tour" enquiry popup. Shows the trip the visitor chose and asks for their contact details.
 * Only on Send does it open WhatsApp and have the API e-mail the office.
 */
const TourEnquiryModal: React.FC<{
  open: boolean;
  onClose: () => void;
  tour: { slug: string; title: string };
  booking: TourBooking | null;
}> = ({ open, onClose, tour, booking }) => {
  const [contact, setContact] = useState<Contact>(EMPTY);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  // Fresh state each time it opens (the typed contact details are kept for a second enquiry).
  useEffect(() => {
    if (!open) return;
    setError("");
    setSent(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !booking) return null;

  const length = tripLength(booking.from, booking.to);
  const included = booking.includes.length ? booking.includes.join(", ") : "None";
  const summary = [
    ["Tour", tour.title],
    ["From", dmy(booking.from)],
    ["To", dmy(booking.to)],
    ["Duration", length],
    ["Travellers", String(booking.travellers)],
    ["Includes", included],
  ];

  // Request Quotation: e-mails everything to the office (no WhatsApp). Waits for the API so the
  // visitor sees whether it really went.
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const problem = check(contact);
    setError(problem);
    if (problem) return;
    const c = Object.fromEntries(Object.entries(contact).map(([k, v]) => [k, v.trim()])) as Contact;
    setSending(true);
    try {
      await requestTourQuote(tour.slug, {
        ...c,
        from: ymd(booking.from),
        to: ymd(booking.to),
        travellers: booking.travellers,
        includes: booking.includes,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send your request. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className='tour-enquiry' role='presentation' onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className='tour-enquiry__dialog' role='dialog' aria-modal='true' aria-labelledby='tour-enquiry-title'>
        <button type='button' className='tour-enquiry__close' aria-label='Close' onClick={onClose}>
          &times;
        </button>
        <h3 className='tour-enquiry__title' id='tour-enquiry-title'>
          {sent ? "Thank You!" : "Tour Enquiry"}
        </h3>
        {sent ? (
          <>
            <p className='tour-enquiry__text'>
              Your quotation request has been sent to Bright Wings. Our team will contact you soon by phone, WhatsApp or
              e-mail.
            </p>
            <button type='button' className='gotur-btn tour-enquiry__submit' onClick={onClose}>
              Close
            </button>
          </>
        ) : (
          <>
            <p className='tour-enquiry__text'>Check your trip and tell us how to reach you.</p>
            <dl className='tour-enquiry__summary'>
              {summary.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <form className='form-one' onSubmit={submit} noValidate>
              <div className='form-one__group'>
                {FIELDS.map((f) => (
                  <div key={f.name} className={`form-one__control ${f.name === "name" || f.name === "departure_address" ? "form-one__control--full" : ""}`}>
                    <label htmlFor={`enquiry-${f.name}`}>
                      {f.label}
                      <span className='form-one__required'>*</span>
                    </label>
                    <input
                      id={`enquiry-${f.name}`}
                      name={f.name}
                      type={f.type}
                      placeholder={f.placeholder}
                      autoComplete={f.autoComplete}
                      maxLength={f.max}
                      value={contact[f.name]}
                      onChange={(e) => setContact((old) => ({ ...old, [f.name]: e.target.value }))}
                    />
                  </div>
                ))}
                <div className='form-one__control form-one__control--full'>
                  <label htmlFor='enquiry-message'>
                    Message / Special Request <span className='tour-enquiry__optional'>(optional)</span>
                  </label>
                  <textarea
                    id='enquiry-message'
                    name='message'
                    placeholder='Hotel preference, food, kids, anything we should know'
                    maxLength={2000}
                    value={contact.message}
                    onChange={(e) => setContact((old) => ({ ...old, message: e.target.value }))}
                  ></textarea>
                </div>
                <div className='form-one__control form-one__control--full'>
                  <button type='submit' className='gotur-btn tour-enquiry__submit' disabled={sending}>
                    {sending ? "Sending..." : "Request Quotation"} <i className='icon-right'></i>
                  </button>
                  {error && (
                    <p role='alert' className='form-one__result form-one__result--error'>
                      {error}
                    </p>
                  )}
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default TourEnquiryModal;
