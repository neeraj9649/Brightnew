"use client";
import { tourLink, type TourCardData } from "@/lib/api";

// One tour card, as on the Tours page, the home page and "Related Tour List":
// photo (with Featured / discount badges), reviews and stars, title, location and Book Now.
// Tour links are plain <a>, not next/link: tours added in the admin portal have no page file, so the
// client router can't load them. A normal page load lets the server's /tour/_/ fallback serve them.
const TourCard: React.FC<{ tour: TourCardData }> = ({ tour }) => {
  const link = tourLink(tour.slug);
  return (
    <div className='listing-card-four wow fadeInUp' data-wow-duration='1500ms'>
      <div className='listing-card-four__image'>
        <a href={link} aria-label={tour.title}>
          <img src={tour.card_image} alt={tour.title} height={"100%"} width={"100%"} />
        </a>
        <div className='listing-card-four__btn-group'>
          {tour.discount ? <div className='listing-card-four__discount'>-{tour.discount}% off</div> : null}
          {tour.is_featured && <div className='listing-card-four__featured'>Featured</div>}
        </div>
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
            {tour.location && (
              <span className='listing-card-four__price__number tour-card__location'>
                <i className='icon-pin1'></i> {tour.location}
              </span>
            )}
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
