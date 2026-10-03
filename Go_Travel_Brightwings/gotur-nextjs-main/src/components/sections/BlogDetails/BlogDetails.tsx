"use client";
import React from "react";

import Image, { StaticImageData } from "next/image";
import { blogDetail } from "@/data/blogDetailsData";
import { usePathname } from "next/navigation";
import { Col, Container, Row } from "react-bootstrap";
import BlogSidebar from "@/components/common/BlogSidebar/BlogSidebar";
import Link from "next/link";
interface BlogDetail {
  title: string;
  date: string;
  image: string;
  content: string[];
  tags: string[];
  comments: Comment[];
  blogImages: string[];
  blockQuote: string;
  quoteImage: string;
  comment: string;
  author: string;
  category: string;
  link: string;
  day: string;
  month: string;
}

// Interface for a comment
interface Comment {
  name: string;
  date: string;
  text: string;
  avatar: string;
}

const BlogDetails: React.FC = () => {
  const {
    title,
    date,
    image,
    content,
    tags,
    comments,
    blogImages,
    blockQuote,
    quoteImage,
    comment,
    author,
    category,
    link,
    day,
    month,
  }: BlogDetail = blogDetail;
  const pathname = usePathname();
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    console.log("Form Submitted:", data);
  };
  return (
    <section className='blog-details-page section-space'>
      <Container>
        <Row className=' justify-content-center'>
          {pathname === "/blog-details-left" ? (
            <Col lg={4}>
              <BlogSidebar />
            </Col>
          ) : null}
          <Col lg={8}>
            <div className='blog-details'>
              {/* Blog Image */}
              <div
                className='blog-details-card wow fadeInUp'
                data-wow-delay='300ms'
                data-wow-duration='1500ms'
              >
                <div className='blog-details-card__image'>
                  <Image src={image} alt='Blog Image' width={150} height={150}/>
                  <div className='blog-details-card__date'>
                    <span className='blog-details-card__date__day'>{day}</span>
                    <span className='blog-details-card__date__month'>
                      {month}
                    </span>
                  </div>
                </div>

                {/* Blog Content */}
                <div className='blog-details-card__content'>
                  <ul
                    className='list-unstyled blog-details-card__meta wow fadeInUp'
                    data-wow-delay='300ms'
                    data-wow-duration='1500ms'
                  >
                    <li>
                      <Link href={link}>
                        <span className='blog-card__meta__icon'>
                          <i className='icon-user'></i>
                        </span>
                        By {author}
                      </Link>
                    </li>
                    <li>
                      {" "}
                      <Link href={link}>
                        {" "}
                        <span className='blog-details-card__meta__icon'>
                          {" "}
                          <i className='icon-massage'></i>
                        </span>{" "}
                        {comment} Comments{" "}
                      </Link>
                    </li>
                    <li>
                      <Link href={link}>
                        <span className='blog-card__meta__icon'>
                          <i className='icon-price-tag'></i>
                        </span>
                        {category}
                      </Link>
                    </li>
                  </ul>

                  <h3
                    className='blog-details-card__title wow fadeInUp'
                    data-wow-delay='300ms'
                    data-wow-duration='1500ms'
                  >
                    {title}
                  </h3>

                  {/* Blog Content */}
                  <div className='blog-details-card__content__inner'>
                    {content.map((text, index) => (
                      <p
                        key={index}
                        className='blog-details-card__text wow fadeInUp'
                        data-wow-delay='300ms'
                        data-wow-duration='1500ms'
                      >
                        {text}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Blog Images in Row */}
              <div className='blog-details__inner'>
                <div className='row gutter-y-30'>
                  {blogImages.map((imgSrc, index) => (
                    <div
                      className='col-md-6 wow fadeInLeft'
                      data-wow-delay={`${100 * index}ms`}
                      key={index}
                    >
                      <div className='blog-details__inner__image'>
                        <Image src={imgSrc} alt='Blog Details' width={150} height={150}/>
                      </div>
                    </div>
                  ))}
                </div>
                <div className='blog-details__inner__content'>
                  <p
                    className='blog-details__inner__text wow fadeInUp animated'
                    data-wow-delay='300ms'
                    data-wow-duration='1500ms'
                  >
                    {content[1]}
                  </p>
                  <blockquote
                    className='blog-details__inner__text-one wow fadeInUp animated'
                    data-wow-delay='300ms'
                    data-wow-duration='1500ms'
                  >
                    {blockQuote}
                    <Image
                      className='blog-details__inner__image'
                      src={quoteImage}
                      alt=''
                      width={20} height={50}
                    />
                  </blockquote>
                  <p
                    className='blog-details__inner__text wow fadeInUp animated'
                    data-wow-delay='300ms'
                    data-wow-duration='1500ms'
                  >
                    {content[0]}
                  </p>
                </div>
              </div>

              {/* Blog Tags */}
              <div className='blog-details__meta'>
                <div
                  className='blog-details__categories wow fadeInUp'
                  data-wow-delay='300ms'
                  data-wow-duration='1500ms'
                >
                  <h4 className='blog-details__meta__title'>Tags:</h4>
                  <div className='blog-details__categories__box'>
                    {tags.map((tag, index) => (
                      <Link
                        href='#'
                        key={index}
                        className='blog-details__categories__btn gotur-btn'
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Social Share Links */}
                <div
                  className='blog-details__social wow fadeInUp'
                  data-wow-delay='300ms'
                  data-wow-duration='1500ms'
                >
                  <h4 className='blog-details__meta__title'>
                    Share with friends:
                  </h4>
                  <div className='blog-details__social__box'>
                    <Link href='https://facebook.com'>
                      <i className='icon-facebook' aria-hidden='true'></i>
                    </Link>
                    <Link href='https://twitter.com'>
                      <i className='icon-twitter' aria-hidden='true'></i>
                    </Link>
                    <Link href='https://instagram.com'>
                      <i className='icon-linkedin' aria-hidden='true'></i>
                    </Link>
                    <Link href='https://youtube.com'>
                      <i className='icon-youtube' aria-hidden='true'></i>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className='comments-one'>
                <h3 className='comments-one__title'>Comments</h3>
                <ul className='list-unstyled comments-one__list'>
                  {comments.map((comment, index) => (
                    <li
                      key={index}
                      className='comments-one__card wow fadeInUp'
                      data-wow-delay='100ms'
                      data-wow-duration='1500ms'
                    >
                      <div className='comments-one__card__image'>
                        <Image src={comment.avatar} alt={comment.name} width={150} height={150}/>
                      </div>
                      <div className='comments-one__card__content'>
                        <div className='comments-one__card__top'>
                          <div className='comments-one__card__info'>
                            <h3 className='comments-one__card__title'>
                              {comment.name}
                            </h3>
                            <p className='comments-one__card__date'>
                              {comment.date}
                            </p>
                          </div>
                          <button
                            type='button'
                            className='comments-one__card__reply'
                          >
                            Reply
                          </button>
                        </div>
                        <p className='comments-one__card__text'>
                          {comment.text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Comment Form */}
              <div className='comments-form'>
                <h3 className='comments-form__title'>Leave a Comment</h3>
                <form
                  className='comments-form__form contact-form-validated form-one'
                  onSubmit={handleSubmit}
                >
                  <div className='form-one__group'>
                    <div
                      className='form-one__control wow fadeInUp'
                      data-wow-duration='1500ms'
                      data-wow-delay='100ms'
                    >
                      <label htmlFor='name'>Your Name*</label>
                      <input
                        type='text'
                        id='name'
                        name='name'
                        placeholder='Your Name'
                      />
                    </div>
                    <div
                      className='form-one__control wow fadeInUp'
                      data-wow-duration='1500ms'
                      data-wow-delay='200ms'
                    >
                      <label htmlFor='email'>Your Email*</label>
                      <input
                        type='email'
                        id='email'
                        name='email'
                        placeholder='Your Email'
                      />
                    </div>
                    <div
                      className='form-one__control form-one__control--full wow fadeInUp'
                      data-wow-duration='1500ms'
                      data-wow-delay='300ms'
                    >
                      <label htmlFor='message'>Message*</label>
                      <textarea
                        name='message'
                        id='message'
                        placeholder='Write Message'
                      ></textarea>
                    </div>
                    <div
                      className='form-one__control form-one__control--full wow fadeInUp'
                      data-wow-duration='1500ms'
                      data-wow-delay='350ms'
                    >
                      <button type='submit' className='gotur-btn'>
                        Post a Comment
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </Col>
          {pathname === "/blog-details-right" ? (
            <Col lg={4}>
              <BlogSidebar />
            </Col>
          ) : null}
        </Row>
      </Container>
    </section>
  );
};

export default BlogDetails;
