"use client";

import Image, { StaticImageData } from "next/image";

import { Container, Row, Col } from "react-bootstrap";

import { blogTwoInfo } from "@/data/blogTwoTwoData";
import Link from "next/link";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
interface BlogData {
  tagline: string;
  title: string;
  link: string;
  linkLabel: string;
  shape: string;
  blogData: BlogPost[];
}
interface BlogPost {
  title: string;
  image: string;
  day: string;
  month: string;
  author: string;
  category: string;
  link: string;
}
const BlogTwoTwo = () => {
  const { tagline, title, link, linkLabel, shape, blogData }: BlogData =
    blogTwoInfo;

  return (
    <section className='blog-two section-space-bottom' id='blog'>
      <Container>
        <div className='blog-two__top'>
          <Row className='align-items-end gutter-y-20'>
            <Col lg={8}>
              <div className='sec-title'>
                <h6 className='sec-title__tagline bw-split-in-right'>
                  <TextAnimation text={tagline} animationType='right' />
                </h6>
                <h3 className='sec-title__title bw-split-in-left'>
                  <TextAnimation text={title} animationType='left' />
                </h3>
              </div>
            </Col>
            <Col lg={4}>
              <div className='blog-two__top__btn'>
                <Link href={link} className='gotur-btn gotur-btn--base'>
                  {linkLabel}{" "}
                  <span className='icon'>
                    <i className='icon-right'></i>
                  </span>
                </Link>
              </div>
            </Col>
          </Row>
        </div>

        <Row className='gutter-y-30'>
          {blogData.map((post: BlogPost, index: number) => (
            <Col lg={4} md={6} key={index}>
              <div
                className='blog-card-two blog-card-two--one wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay={`${100 * (index + 1)}ms`}
              >
                <div className='blog-card-two__image'>
                  <Image
                    src={post.image}
                    alt={post.title}
                    className='img-fluid'
                  />
                  <div className='blog-card-two__date'>
                    <span className='blog-card-two__date__day'>{post.day}</span>
                    <span className='blog-card-two__date__month'>
                      {post.month}
                    </span>
                  </div>
                  <Link href={post.link} className='blog-card-two__image__link'>
                    <span className='sr-only'>{post.title}</span>
                  </Link>
                </div>
                <div className='blog-card-two__content'>
                  <ul className='list-unstyled blog-card-two__meta'>
                    <li>
                      <Link href={post.link}>
                        <span className='blog-card-two__meta__icon'>
                          <i className='icon-user'></i>
                        </span>{" "}
                        By {post.author}
                      </Link>
                    </li>
                    <li>
                      <Link href={post.link}>
                        <span className='blog-card-two__meta__icon'>
                          <i className='icon-price-tag'></i>
                        </span>{" "}
                        {post.category}
                      </Link>
                    </li>
                  </ul>
                  <h3 className='blog-card-two__title'>
                    <Link href={post.link}>{post.title}</Link>
                  </h3>
                  <Link
                    href={post.link}
                    className='blog-card-two__content__btn'
                  >
                    Read More <i className='icon-arrow-right'></i>
                  </Link>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>

      <div className='blog-two__element'>
        <Image src={shape} alt='' />
      </div>
    </section>
  );
};

export default BlogTwoTwo;
