"use client";
import React from "react";
import dynamic from "next/dynamic";
import { Container } from "react-bootstrap";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import { products } from "@/data/products";
import { blogGridData } from "@/data/blogGridData";
const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});
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
  posts: BlogPost[];
}
const BlogCarousel: React.FC = () => {
  const { posts }: BlogData = blogGridData;
  return (
    <section className='blog-page section-space'>
      <Container>
        <div className='blog-page__carousel gotur-owl__carousel gotur-owl__carousel--with-shadow gotur-owl__carousel--basic-nav owl-carousel owl-theme owl-loaded owl-drag'>
          <TinySlider
            settings={{
              items: 1,
              gutter: 30,
              loop: false,
              nav: false,
              autoplay: false,
              controls: true,
              mouseDrag: true,
              controlsContainer: ".owl-nav",
              responsive: {
                0: {
                  items: 1,
                },
                768: {
                  items: 2,
                },
                992: {
                  items: 3,
                },
              },
            }}
          >
            {posts.map((post: BlogPost) => (
              <div className='item' key={post.id}>
                <div
                  className='blog-card wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay={`${100 * post.id}ms`}
                >
                  <div className='blog-card__image'>
                    <Image src={post.image} alt={post.title} />
                    <Link
                      href={post.link}
                      className='blog-card-two__image__link'
                    >
                      <span className='sr-only'>{post.title}</span>
                    </Link>
                  </div>
                  <div className='blog-card__content'>
                    <div className='blog-card__content__top'>
                      <div className='blog-card__date'>
                        <span className='blog-card__date__day'>{post.day}</span>
                        <span className='blog-card__date__month'>
                          {post.month}
                        </span>
                      </div>
                      <ul className='list-unstyled blog-card__meta'>
                        <li>
                          <Link href={post.link}>
                            <span className='blog-card__meta__icon'>
                              <i className='icon-user'></i>
                            </span>
                            By {post.author}
                          </Link>
                        </li>
                        <li>
                          <Link href={post.link}>
                            <span className='blog-card__meta__icon'>
                              <i className='icon-price-tag'></i>
                            </span>
                            {post.category}
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <h3 className='blog-card__title'>
                      <Link href={post.link}>{post.title}</Link>
                    </h3>
                    <Link href={post.link} className='blog-card__content__btn'>
                      Read More <i className='icon-arrow-right'></i>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </TinySlider>
          <div className='owl-nav'>
            <button
              type='button'
              role='presentation'
              className='owl-prev'
              aria-label='carousel button'
            >
              <span className='icon-arrow-left'></span>
            </button>
            <button
              type='button'
              role='presentation'
              className='owl-next'
              aria-label='carousel button'
            >
              <span className='icon-arrow-right'></span>
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default BlogCarousel;
