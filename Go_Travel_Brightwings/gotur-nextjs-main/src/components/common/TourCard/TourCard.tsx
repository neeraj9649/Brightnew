"use client";
import Link from "next/link";
import { Item } from "react-photoswipe-gallery";
import { tourLink, type TourCardData } from "@/lib/api";

// One tour card, as on the Tours page, the home page and "Related Tour List".
// Must sit inside a react-photoswipe-gallery <Gallery> (the image icon opens the photo).
// Tour links are plain <a>, not next/link: tours added in the admin portal have no page file, so the
// client router can't load them. A normal page load lets the server's /tour/_/ fallback serve them.
const TourCard: React.FC<{ tour: TourCardData; onVideo: (videoId: string) => void }> = ({ tour, onVideo }) => {
  const link = tourLink(tour.slug);
  const meta = [
    { icon: "icon-pin1", title: tour.location },
    { icon: "icon-calendar", title: tour.duration },
  ].filter((m) => m.title);
  return (
    <div className='listing-card-four wow fadeInUp' data-wow-duration='1500ms'>
      <div className='listing-card-four__image'>
        <img src={tour.card_image} alt={tour.title} height={"100%"} width={"100%"} />
        <div className='listing-card-four__btn-group'>
          {tour.discount ? <div className='listing-card-four__discount'>-{tour.discount}% off</div> : null}
          {tour.is_featured && <div className='listing-card-four__featured'>Featured</div>}
        </div>
        <div className='listing-card-four__btns'>
          <a href={link} aria-label={tour.title}>
            <i className='far fa-heart'></i>
          </a>
          <div className='listing-card-four__btns__hover'>
            <Item original={tour.card_image} thumbnail={tour.card_image} width='370' height='257'>
              {({ ref, open }) => (
                <Link
                  href='#'
                  className='listing-card-four__popup card__popup'
                  ref={ref}
                  onClick={(e) => {
                    e.preventDefault();
                    open(e);
                  }}
                >
                  <span className='icon-image'></span>
                </Link>
              )}
            </Item>
            {tour.video_id && (
              <Link
                className='video-popup'
                href={`https://www.youtube.com/watch?v=${tour.video_id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onVideo(tour.video_id);
                }}
              >
                <span className='icon-video'></span>
              </Link>
            )}
          </div>
        </div>
        {meta.length > 0 && (
          <ul className='listing-card-four__meta list-unstyled'>
            {meta.map((m) => (
              <li key={m.icon}>
                <a href={link}>
                  <span className='listing-card-four__meta__icon'>
                    <i className={m.icon}></i>
                  </span>
                  {m.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className='listing-card-four__content'>
        <div className='listing-card-four__rating'>
          <span>({tour.review_count} Review)</span>
          {[...Array(tour.rating)].map((_, i) => (
            <i key={i} className='icon-star'></i>
          ))}
        </div>
        <h3 className='listing-card-four__title'>
          <a href={link}>{tour.title}</a>
        </h3>
        <div className='listing-card-four__content__btn'>
          <div className='listing-card-four__price'>
            <span className='listing-card-four__price__sub'>Per Day</span>
            <span className='listing-card-four__price__number'>{tour.price}</span>
          </div>
          <a href={link} className='listing-card-four__btn gotur-btn'>
            Book Now{" "}
            <span className='icon'>
              <i className='icon-right'></i>{" "}
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default TourCard;
