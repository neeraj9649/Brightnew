-- Clear existing blog content once, preserving the tables for future posts and comments.
TRUNCATE TABLE blog_comments, blog_posts RESTRICT;
