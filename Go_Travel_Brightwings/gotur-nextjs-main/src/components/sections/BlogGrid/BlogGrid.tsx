"use client";

import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Link from "next/link";
import { blogDate, blogLink, getBlogPosts, type BlogPostSummary } from "@/lib/api";

// Blog page: every published post from the admin portal, newest first.
const BlogGrid: React.FC = () => {
  const [posts, setPosts] = useState<BlogPostSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getBlogPosts().then(setPosts).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <section className='blog-page section-space'>
      <Container className='container'>
        <Row className='gutter-y-30'>
          {error ? (
            <Col lg={12}><p className='text-center'>{error}</p></Col>
          ) : !posts ? (
            <Col lg={12}><p className='text-center'>Loading posts…</p></Col>
          ) : !posts.length ? (
            <Col lg={12}><p className='text-center'>No blog posts yet. Please check back soon.</p></Col>
          ) : (
            posts.map((post, index) => {
              const date = blogDate(post.published_on);
              const link = blogLink(post.slug);
              return (
                <Col lg={4} md={6} key={post.slug}>
                  <div
                    className='blog-card wow fadeInUp'
                    data-wow-duration='1500ms'
                    data-wow-delay={`${100 * ((index % 3) + 1)}ms`}
                  >
                    <div className='blog-card__image'>
                      <img src={post.cover_image} alt={post.title} />
                      <Link href={link} className='blog-card-two__image__link'>
                        <span className='sr-only'>{post.title}</span>
                      </Link>
                    </div>
                    <div className='blog-card__content'>
                      <div className='blog-card__content__top'>
                        <ul className='list-unstyled blog-card__meta'>
                          <li>
                            <span className='blog-card__meta__icon'>
                              <i className='icon-calendar'></i>
                            </span>
                            <small>{date.full}</small>
                          </li>
                        </ul>
                      </div>
                      <h3 className='blog-card__title'>
                        <Link href={link}>{post.title}</Link>
                      </h3>
                      <Link href={link} className='blog-card__content__btn'>
                        Read More <i className='icon-arrow-right'></i>
                      </Link>
                    </div>
                  </div>
                </Col>
              );
            })
          )}
        </Row>
      </Container>
    </section>
  );
};

export default BlogGrid;
