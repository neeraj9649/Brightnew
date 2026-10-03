"use client";
import { blogSidebarData } from "@/data/blogSIdebar";
import Image from "next/image";
import Link from "next/link";
import React from "react";
interface Category {
  label: string;
  count: number;
}

interface RecentPost {
  title: string;
  date: string;
  image: string;
  link: string;
}

interface Tag {
  label: string;
}
interface SidebarData {
  categories: Category[];
  recentPosts: RecentPost[];
  tags: Tag[];
}

const BlogSidebar: React.FC = () => {
  const { categories, recentPosts, tags }: SidebarData = blogSidebarData;
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const searchTerm = formData.get("search");

    console.log("Search submitted:", searchTerm);
  };

  return (
    <div className='sidebar'>
      <aside className='widget-area'>
        {/* Search Widget */}
        <div
          className='sidebar__form sidebar__single wow fadeInUp animated'
          data-wow-duration='1500ms'
          data-wow-delay='500ms'
        >
          <h4 className='sidebar__title sidebar__form__title'>Search</h4>
          <form className='sidebar__search' onSubmit={handleSubmit}>
            <input type='text' name='search' placeholder='Search Here' />
            <button
              type='submit'
              aria-label='search submit'
              className='sidebar__search__icon gotur-btn'
            >
              <i className='icon-search-interface-symbol'></i>
            </button>
          </form>
        </div>

        {/* Categories Widget */}
        <div
          className='sidebar__categories-wrapper sidebar__single wow fadeInUp animated'
          data-wow-duration='1500ms'
          data-wow-delay='500ms'
        >
          <h4 className='sidebar__title'>Categories</h4>
          <ul className='sidebar__categories list-unstyled'>
            {categories.map((category: Category, index: number) => (
              <li key={index}>
                <Link href='#'>
                  {category.label}
                  <span>({category.count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Posts Widget */}
        <div
          className='sidebar__posts-wrapper sidebar__single wow fadeInUp animated'
          data-wow-duration='1500ms'
          data-wow-delay='500ms'
        >
          <h4 className='sidebar__title'>Recent Post</h4>
          <ul className='sidebar__posts list-unstyled'>
            {recentPosts.map((post: RecentPost, index: number) => (
              <li key={index} className='sidebar__posts__item'>
                <div className='sidebar__posts__image'>
                  <Image src={post.image} alt='Latest posts' width={50} height={50}/>
                </div>
                <div className='sidebar__posts__content'>
                  <div className='sidebar__posts__meta'>
                    <Link href='#'>
                      <span className='sidebar__posts__meta__icon'>
                        <i className='icon-calendar'></i>
                      </span>
                      {post.date}
                    </Link>
                  </div>
                  <h4 className='sidebar__posts__title'>
                    <Link href={post.link}>{post.title}</Link>
                  </h4>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Tags Widget */}
        <div
          className='sidebar__tags-wrapper sidebar__single wow fadeInUp animated'
          data-wow-duration='1500ms'
          data-wow-delay='500ms'
        >
          <h4 className='sidebar__title'>Tags</h4>
          <div className='sidebar__tags'>
            {tags.map((tag: Tag, index: number) => (
              <Link key={index} href='#' className='gotur-btn'>
                {tag.label}
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default BlogSidebar;
