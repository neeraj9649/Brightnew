'use client';

import Image, { StaticImageData } from 'next/image';
import blogTwoData from '@/data/blogTwoData';
import Link from 'next/link';

interface BlogPost {
  image: string;
  date: {
    day: string;
    month: string;
  };
  author: string;
  category: string;
  title: string;
  link: string;
}

const BlogTwo = () => {
  const {
    sectionTagline,
    sectionTitle,
    buttonText,
    buttonLink,
    mainBlog,
    blogs,
  }: {
    sectionTagline: string;
    sectionTitle: string;
    buttonText: string;
    buttonLink: string;
    mainBlog: BlogPost;
    blogs: BlogPost[];
  } = blogTwoData;

  return (
    <section className="blog-two section-space" id="blog">
      <div className="container">
        <div className="blog-two__top">
          <div className="row align-items-end">
            <div className="col-lg-8">
              <div className="sec-title">
                <h6 className="sec-title__tagline bw-split-in-right">{sectionTagline}</h6>
                <h3
                  className="sec-title__title bw-split-in-left"
                  dangerouslySetInnerHTML={{ __html: sectionTitle }}
                />
              </div>
            </div>
            <div className="col-lg-4">
              <div className="blog-two__top__btn text-lg-end">
                <Link href={buttonLink} className="gotur-btn gotur-btn--base">
                  {buttonText}
                  <span className="icon">
                    <i className="icon-right"></i>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="row gutter-y-30">
          {/* Main Left Blog */}
          <div className="col-lg-6">
            <div className="blog-two__left wow fadeInLeft" data-wow-duration="1500ms" data-wow-delay="300ms">
              <div className="blog-two-card">
                <div className="blog-two-card__image position-relative">
                  <Image src={mainBlog.image} alt={mainBlog.title} className="img-fluid" />
                  <Link href={mainBlog.link} className="blog-two-card__image__link"></Link>
                  <div className="blog-two-card__date">
                    <span>{mainBlog.date.day}</span> {mainBlog.date.month}
                  </div>
                </div>
                <div className="blog-two-card__content">
                  <ul className="list-unstyled blog-two-card__meta">
                    <li>
                      <Link href="/blog-list">
                        <i className="icon-user"></i>By {mainBlog.author}
                      </Link>
                    </li>
                    <li>
                      <Link href={mainBlog.link}>
                        <i className="icon-price-tag"></i>{mainBlog.category}
                      </Link>
                    </li>
                  </ul>
                  <h3 className="blog-two-card__title">
                    <Link href={mainBlog.link}>{mainBlog.title}</Link>
                  </h3>
                  <div className="blog-two-card__link">
                    <Link href={mainBlog.link} className="blog-two-card__btn">
                      Read More <i className="icon-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Blog List */}
          <div className="col-lg-6">
            <div className="blog-two-card__list">
              {blogs.map((post, idx) => (
                <div
                  key={idx}
                  className="blog-two-card wow fadeInUp"
                  data-wow-duration="1500ms"
                  data-wow-delay="300ms"
                >
                  <div className="blog-two-card__image position-relative">
                    <Image src={post.image} alt={post.title} className="img-fluid" />
                    <Link href={post.link} className="blog-two-card__image__link"></Link>
                    <div className="blog-two-card__date">
                      <span>{post.date.day}</span> {post.date.month}
                    </div>
                  </div>
                  <div className="blog-two-card__content">
                    <ul className="list-unstyled blog-two-card__meta">
                      <li>
                        <Link href="/blog-list">
                          <i className="icon-user"></i>By {post.author}
                        </Link>
                      </li>
                      <li>
                        <Link href={post.link}>
                          <i className="icon-price-tag"></i>{post.category}
                        </Link>
                      </li>
                    </ul>
                    <h3 className="blog-two-card__title">
                      <Link href={post.link}>{post.title}</Link>
                    </h3>
                    <div className="blog-two-card__link">
                      <Link href={post.link} className="blog-two-card__btn">
                        Read More <i className="icon-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogTwo;
