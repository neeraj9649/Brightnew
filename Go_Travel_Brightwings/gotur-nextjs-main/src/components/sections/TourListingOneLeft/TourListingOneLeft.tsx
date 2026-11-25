"use client";
import React, { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";
import TourCard from "@/components/common/TourCard/TourCard";
import { getTourLocations, getTours, type TourPage } from "@/lib/api";

const PER_PAGE = 15;

// Tours page: published tours from the admin portal, 3 per row and 15 per page, with a location filter
// listing only locations that have tours.
const TourListingOneLeft: React.FC = () => {
  const [offset, setOffset] = useState(0);
  const [location, setLocation] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [page, setPage] = useState<TourPage | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getTourLocations().then(setLocations).catch(() => setLocations([]));
  }, []);

  useEffect(() => {
    setError("");
    getTours(PER_PAGE, offset, false, location)
      .then(setPage)
      .catch((e: Error) => setError(e.message));
  }, [offset, location]);

  const pages = page ? Math.ceil(page.total / PER_PAGE) : 0;
  const current = Math.floor(offset / PER_PAGE) + 1;
  const go = (n: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (n < 1 || n > pages || n === current) return;
    setOffset((n - 1) * PER_PAGE);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className='tour-listing-page section-space '>
      <div className='container '>
        <div className='tour-filter'>
          <label htmlFor='tour-location' className='tour-filter__label'>
            <i className='icon-pin1'></i> Location
          </label>
          <select
            id='tour-location'
            className='tour-filter__select'
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setOffset(0);
            }}
          >
            <option value=''>All locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p className='text-center'>{error}</p>
        ) : !page ? (
          <p className='text-center'>Loading tours…</p>
        ) : !page.items.length ? (
          <p className='text-center'>{location ? `No tours in ${location} yet.` : "No tours yet. Please check back soon."}</p>
        ) : (
          <Row className='gutter-y-30 gutter-x-30'>
            {page.items.map((tour) => (
              <Col xs={12} md={6} lg={4} key={tour.slug}>
                <div className='item '>
                  <TourCard tour={tour} />
                </div>
              </Col>
            ))}
            {pages > 1 && (
              <Col xs={12}>
                <ul className='post-pagination justify-content-center'>
                  <li className={current === 1 ? "disabled" : ""}>
                    <a href='#' className='previous' onClick={go(current - 1)} aria-disabled={current === 1}>
                      Previous
                    </a>
                  </li>
                  {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                    <li key={n} className={n === current ? "active" : ""}>
                      <a href='#' onClick={go(n)} aria-current={n === current ? "page" : undefined}>
                        {n}
                      </a>
                    </li>
                  ))}
                  <li className={current === pages ? "disabled" : ""}>
                    <a href='#' className='next' onClick={go(current + 1)} aria-disabled={current === pages}>
                      Next
                    </a>
                  </li>
                </ul>
              </Col>
            )}
          </Row>
        )}
      </div>
    </section>
  );
};

export default TourListingOneLeft;
