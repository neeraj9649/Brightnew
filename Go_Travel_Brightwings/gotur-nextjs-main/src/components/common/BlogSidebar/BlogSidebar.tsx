"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { blogDate, blogLink, getBlogPosts, type BlogPostSummary } from "@/lib/api";

// Blog sidebar: the latest posts from the admin portal. The template's search, categories and
// tags widgets were static placeholders, so they are gone.
const BlogSidebar: React.FC<{ exclude?: string }> = ({ exclude }) => {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  useEffect(() => {
    getBlogPosts().then(setPosts).catch(() => setPosts([]));
  }, []);
  const recent = posts.filter((p) => p.slug !== exclude).slice(0, 3);
  if (!recent.length) return null;

  return (
    <div className='sidebar'>
      <aside className='widget-area'>
        <div
          className='sidebar__posts-wrapper sidebar__single wow fadeInUp animated'
          data-wow-duration='1500ms'
          data-wow-delay='300ms'
        >
          <h4 className='sidebar__title'>Recent Post</h4>
          <ul className='sidebar__posts list-unstyled'>
            {recent.map((post) => (
              <li key={post.slug} className='sidebar__posts__item'>
                <div className='sidebar__posts__image'>
                  <img src={post.cover_image} alt={post.title} width={50} height={50} />
                </div>
                <div className='sidebar__posts__content'>
                  <div className='sidebar__posts__meta'>
                    <span className='sidebar__posts__meta__icon'>
                      <i className='icon-calendar'></i>
                    </span>
                    {blogDate(post.published_on).full}
                  </div>
                  <h4 className='sidebar__posts__title'>
                    <Link href={blogLink(post.slug)}>{post.title}</Link>
                  </h4>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default BlogSidebar;
