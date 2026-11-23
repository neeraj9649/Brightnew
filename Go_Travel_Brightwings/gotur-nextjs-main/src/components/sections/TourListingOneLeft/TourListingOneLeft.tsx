"use client";
import React, { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { Gallery as PhotoSwipeGallery } from "react-photoswipe-gallery";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import TourSidebar from "@/components/common/TourSidebar/TourSidebar";
import TourCard from "@/components/common/TourCard/TourCard";
import { getTours, type TourPage } from "@/lib/api";

const PER_PAGE = 15;

// Tours page: published tours from the admin portal, 15 per page.
const TourListingOneLeft: React.FC = () => {
  const [isOpen, setOpen] = useState(false);
  const [videoId, setVideoId] = useState("");
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState<TourPage | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    getTours(PER_PAGE, offset)
      .then(setPage)
      .catch((e: Error) => setError(e.message));
  }, [offset]);

  const pages = page ? Math.ceil(page.total / PER_PAGE) : 0;
  const current = Math.floor(offset / PER_PAGE) + 1;
  const go = (n: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (n < 1 || n > pages || n === current) return;
    setOffset((n - 1) * PER_PAGE);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <section className='tour-listing-page section-space '>
        <div className='container '>
          <Row className='gutter-y-10'>
            <Col lg={4}>
              <TourSidebar />
            </Col>

            {/* Tour Listings */}
            <Col lg={8}>
              {error ? (
                <p className='text-center'>{error}</p>
              ) : !page ? (
                <p className='text-center'>Loading tours…</p>
              ) : !page.items.length ? (
                <p className='text-center'>No tours yet. Please check back soon.</p>
              ) : (
                <PhotoSwipeGallery>
                  <Row className='gutter-y-30 gutter-x-30'>
                    {page.items.map((tour) => (
                      <Col xs={12} sm={6} key={tour.slug}>
                        <div className='item '>
                          <TourCard
                            tour={tour}
                            onVideo={(id) => {
                              setVideoId(id);
                              setOpen(true);
                            }}
                          />
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
                </PhotoSwipeGallery>
              )}
            </Col>
          </Row>
        </div>
      </section>
      <VideoModal isOpen={isOpen} setOpen={setOpen} id={videoId} />
    </>
  );
};

export default TourListingOneLeft;
