"use client";

import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { blogData } from "@/data/blogFiveData";
import Image from "next/image";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";

interface BlogPost {
  id: number;
  image: string;
  title: string;
  link: string;
  date: string;
  day: string;
  month: string;
  author: string;
  category: string;
}

// Define the interface for the blog data
interface BlogData {
  subTitle: string;
  title: string;
  titleSpan: string;
  description: string;
  posts: BlogPost[];
}
const BlogFive: React.FC = () => {
  const { posts, subTitle, title, titleSpan }: BlogData = blogData;
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
          {posts.map((post) => (
            <Col
              xl={3}
              className='col-xl-3 col-lg-4 col-md-6 col-sm-6'
              key={post.id}
            >
              <div
                className='blog-card-two blog-card-two--two wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay={`${100 * post.id}ms`}
              >
                <div className='blog-card-two__image'>
                  <img src={post.image} alt={post.title} width={200} height={200}/>
                  <Link href={post.link} className='blog-card-two__image__link'>
                    <span className='sr-only'>{post.title}</span>
                  </Link>
                </div>
                <div className='blog-card-two__content'>
                  <div className='blog-card-two__top'>
                    <div className='blog-card-two__date'>
                      <span className='blog-card-two__date__day'>
                        {post.day}
                      </span>
                      <span className='blog-card-two__date__month'>
                        {post.month}
                      </span>
                    </div>
                    <ul className='list-unstyled blog-card-two__meta'>
                      <li>
                        <Link href={post.link}>
                          <span className='blog-card-two__meta__icon'>
                            <i className='icon-user'></i>
                          </span>
                          By {post.author}
                        </Link>
                      </li>
                      <li>
                        <Link href={post.link}>
                          <span className='blog-card-two__meta__icon'>
                            <i className='icon-price-tag'></i>
                          </span>
                          {post.category}
                        </Link>
                      </li>
                    </ul>
                  </div>
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
    </section>
  );
};

export default BlogFive;
