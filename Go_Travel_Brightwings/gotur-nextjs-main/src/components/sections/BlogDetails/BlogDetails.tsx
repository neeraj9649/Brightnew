"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Col, Container, Row } from "react-bootstrap";
import BlogSidebar from "@/components/common/BlogSidebar/BlogSidebar";
import Link from "next/link";
import { blogDate, getBlogPost, postBlogComment, type BlogPost } from "@/lib/api";

const paragraphs = (text: string) =>
  text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

// One blog post, picked by ?slug= (the site is a static export, so there is no page per post).
const BlogDetailsInner: React.FC = () => {
  const slug = useSearchParams().get("slug") ?? "";
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setPost(null);
    setError("");
    setResult(null);
    if (!slug) {
      setError("This blog post was not found");
      return;
    }
    getBlogPost(slug).then(setPost).catch((e: Error) => setError(e.message));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const form = e.currentTarget;
    const value = (name: string) => String(new FormData(form).get(name) ?? "").trim();
    setSending(true);
    setResult(null);
    try {
      await postBlogComment(slug, { name: value("name"), email: value("email"), message: value("message") });
      form.reset();
      setResult({ ok: true, text: "Thank you! Your comment will appear here once it is approved." });
    } catch (err) {
      setResult({ ok: false, text: err instanceof Error ? err.message : "We couldn't post your comment. Please try again." });
    } finally {
      setSending(false);
    }
  };

  if (error || !post) {
    return (
      <section className='blog-details-page section-space'>
        <Container>
          <p className='text-center'>
            {error ? <>{error}. <Link href='/blog-grid/'>See all posts</Link></> : "Loading…"}
          </p>
        </Container>
      </section>
    );
  }

  const date = blogDate(post.published_on);
  return (
    <section className='blog-details-page section-space'>
      <Container>
        <Row className=' justify-content-center'>
          <Col lg={4}>
            <BlogSidebar exclude={post.slug} />
          </Col>
          <Col lg={8}>
            <div className='blog-details'>
              {/* Blog Image */}
              <div
                className='blog-details-card wow fadeInUp'
                data-wow-delay='300ms'
                data-wow-duration='1500ms'
              >
                <div className='blog-details-card__image'>
                  <img src={post.cover_image} alt={post.title} />
                  <div className='blog-details-card__date'>
                    <span className='blog-details-card__date__day'>{date.day}</span>
                    <span className='blog-details-card__date__month'>{date.month}</span>
                  </div>
                </div>

                {/* Blog Content */}
                <div className='blog-details-card__content'>
                  <ul className='list-unstyled blog-details-card__meta'>
                    <li>
                      <span className='blog-card__meta__icon'>
                        <i className='icon-calendar'></i>
                      </span>
                      <small>{date.full}</small>
                    </li>
                    <li>
                      <a href='#comments'>
                        <span className='blog-details-card__meta__icon'>
                          <i className='icon-massage'></i>
                        </span>{" "}
                        {post.comments.length} {post.comments.length === 1 ? "Comment" : "Comments"}
                      </a>
                    </li>
                  </ul>

                  <h3 className='blog-details-card__title'>{post.title}</h3>

                  <div className='blog-details-card__content__inner'>
                    {paragraphs(post.content).map((text, index) => (
                      <p key={index} className='blog-details-card__text'>
                        {text}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inner images, text, quote, closing text: each only when the admin filled it in */}
              {(post.inner_images.length > 0 || post.inner_text || post.quote || post.closing_text) && (
                <div className='blog-details__inner'>
                  {post.inner_images.length > 0 && (
                    <div className='row gutter-y-30'>
                      {post.inner_images.map((imgSrc, index) => (
                        <div className='col-md-6' key={index}>
                          <div className='blog-details__inner__image'>
                            <img src={imgSrc} alt='' />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className='blog-details__inner__content'>
                    {paragraphs(post.inner_text).map((text, index) => (
                      <p key={`i${index}`} className='blog-details__inner__text'>{text}</p>
                    ))}
                    {post.quote && (
                      <blockquote className='blog-details__inner__text-one'>
                        {post.quote}
                        <img className='blog-details__inner__image' src='/images/shapes/quote-Icon.png' alt='' width={20} height={50} />
                      </blockquote>
                    )}
                    {paragraphs(post.closing_text).map((text, index) => (
                      <p key={`c${index}`} className='blog-details__inner__text'>{text}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags and share */}
              <div className='blog-details__meta'>
                {post.tags.length > 0 && (
                  <div className='blog-details__categories'>
                    <h4 className='blog-details__meta__title'>Tags:</h4>
                    <div className='blog-details__categories__box'>
                      {post.tags.map((tag) => (
                        <span key={tag} className='blog-details__categories__btn gotur-btn'>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className='blog-details__social'>
                  <h4 className='blog-details__meta__title'>Share with friends:</h4>
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

              {/* Approved comments */}
              <div className='comments-one' id='comments'>
                <h3 className='comments-one__title'>Comments</h3>
                {post.comments.length === 0 && <p>No comments yet. Be the first to share your thoughts.</p>}
                <ul className='list-unstyled comments-one__list'>
                  {post.comments.map((comment, index) => (
                    <li key={index} className='comments-one__card'>
                      <div className='comments-one__card__image'>
                        <span className='comments-one__avatar' aria-hidden='true'>
                          {comment.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className='comments-one__card__content'>
                        <div className='comments-one__card__top'>
                          <div className='comments-one__card__info'>
                            <h3 className='comments-one__card__title'>{comment.name}</h3>
                            <p className='comments-one__card__date'>{blogDate(comment.created_at).full}</p>
                          </div>
                        </div>
                        <p className='comments-one__card__text'>{comment.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Comment Form */}
              <div className='comments-form'>
                <h3 className='comments-form__title'>Leave a Comment</h3>
                <form className='comments-form__form form-one' onSubmit={handleSubmit}>
                  <div className='form-one__group'>
                    <div className='form-one__control'>
                      <label htmlFor='name'>Name<span className='form-one__required'>*</span></label>
                      <input type='text' id='name' name='name' placeholder='Name' required maxLength={100} />
                    </div>
                    <div className='form-one__control'>
                      <label htmlFor='email'>Email<span className='form-one__required'>*</span></label>
                      <input type='email' id='email' name='email' placeholder='Email' required maxLength={200} />
                    </div>
                    <div className='form-one__control form-one__control--full'>
                      <label htmlFor='message'>Message<span className='form-one__required'>*</span></label>
                      <textarea name='message' id='message' placeholder='Write Message' required maxLength={2000}></textarea>
                    </div>
                    <div className='form-one__control form-one__control--full'>
                      <button type='submit' className='gotur-btn' disabled={sending}>
                        {sending ? "Posting..." : "Post a Comment"}
                      </button>
                      {result && (
                        <p
                          role={result.ok ? "status" : "alert"}
                          className={`form-one__result ${result.ok ? "form-one__result--ok" : "form-one__result--error"}`}
                        >
                          {result.text}
                        </p>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

// useSearchParams needs a Suspense boundary in a static export.
const BlogDetails: React.FC = () => (
  <Suspense fallback={null}>
    <BlogDetailsInner />
  </Suspense>
);

export default BlogDetails;
