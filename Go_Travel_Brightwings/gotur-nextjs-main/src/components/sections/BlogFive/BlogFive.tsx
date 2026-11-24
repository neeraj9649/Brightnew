"use client";

import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { blogData } from "@/data/blogFiveData";
import Link from "next/link";
import { useEffect, useState } from "react";
import { blogDate, blogLink, getBlogPosts, type BlogPostSummary } from "@/lib/api";
import { Col, Container, Row } from "react-bootstrap";

// Section heading text stays in blogFiveData; the posts come from the admin portal.
interface BlogHeading {
  subTitle: string;
  title: string;
  titleSpan: string;
}
const BlogFive: React.FC = () => {
  const { subTitle, title, titleSpan }: BlogHeading = blogData;
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  useEffect(() => {
    // The home page still works if the blog can't load; the section just has no cards.
    getBlogPosts().then((all) => setPosts(all.slice(0, 4))).catch(() => setPosts([]));
  }, []);
  return (
    <section className='blog-five section-space-top' id='blog'>
      <Container className='container'>
        <div className='sec-title text-center '>
          <h6 className='sec-title__tagline bw-split-in-right '>
            <TextAnimation text={subTitle} animationType='right' />
          </h6>
          <h3 className='sec-title__title offer_title bw-split-in-left d-flex justify-content-center gap-2'>
            <TextAnimation text={title} animationType='left' />{" "}
            <span>
              {" "}
              <TextAnimation text={titleSpan} animationType='left' />
            </span>
          </h3>
        </div>

        <Row className='gutter-y-30'>
          {posts.map((post, index) => {
            const date = blogDate(post.published_on);
            const link = blogLink(post.slug);
            return (
              <Col
                xl={3}
                className='col-xl-3 col-lg-4 col-md-6 col-sm-6'
                key={post.slug}
              >
                <div
                  className='blog-card-two blog-card-two--two wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay={`${100 * (index + 1)}ms`}
                >
                  <div className='blog-card-two__image'>
                    <img src={post.cover_image} alt={post.title} width={200} height={200}/>
                    <Link href={link} className='blog-card-two__image__link'>
                      <span className='sr-only'>{post.title}</span>
                    </Link>
                  </div>
                  <div className='blog-card-two__content'>
                    <div className='blog-card-two__top'>
                      <ul className='list-unstyled blog-card-two__meta'>
                        <li>
                          <span className='blog-card-two__meta__icon'>
                            <i className='icon-calendar'></i>
                          </span>
                          <small>{date.full}</small>
                        </li>
                      </ul>
                    </div>
                    <h3 className='blog-card-two__title'>
                      <Link href={link}>{post.title}</Link>
                    </h3>
                    <Link href={link} className='blog-card-two__content__btn'>
                      Read More <i className='icon-arrow-right'></i>
                    </Link>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      </Container>
    </section>
  );
};

export default BlogFive;
