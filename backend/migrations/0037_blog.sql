-- Website blog (brightwingstravel.in Blog page) managed from the admin portal, with comments
-- that only appear after an admin approves them.
-- Seeds the 6 posts the website showed before (template text and images), so the Blog page looks
-- the same after the switch to the API. Admin edits or hides them from /admin/blog.
-- Idempotent: tables are created once and seed rows are only added (ON CONFLICT DO NOTHING keeps
-- later edits). Nothing is updated or deleted.

CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(160) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),  -- used in the page link
    title VARCHAR(200) NOT NULL CHECK (length(trim(title)) > 0),
    published_on DATE NOT NULL DEFAULT CURRENT_DATE,
    cover_image TEXT NOT NULL,                  -- image URL
    content TEXT NOT NULL DEFAULT '',           -- opening paragraphs, separated by a blank line
    inner_images TEXT[] NOT NULL DEFAULT '{}',  -- up to 2 image URLs shown side by side
    inner_text TEXT NOT NULL DEFAULT '',        -- text before the quote
    quote TEXT NOT NULL DEFAULT '',
    closing_text TEXT NOT NULL DEFAULT '',      -- text after the quote
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts (published_on DESC) WHERE is_published;

CREATE TABLE IF NOT EXISTS blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    ip_address VARCHAR(64),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments (post_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON blog_comments (status, created_at);

INSERT INTO blog_posts (slug, title, published_on, cover_image, content, inner_images, inner_text, quote, closing_text, tags)
SELECT s.slug, s.title, s.published_on::date, 'https://brightwingstravel.in/images/blog/' || s.cover,
    E'Consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore of magna aliqua. Ut enim ad minim veniam, made of owl the quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea dolor commodo consequat. Duis aute irure and dolor in reprehenderit.\n\nThe is ipsum dolor sit amet consectetur adipiscing elit. Fusce eleifend porta arcu In hac habitasse the is platea augue thelorem turpoi dictumst. In lacus libero faucibus at malesuada sagittis placerat eros sed istincidunt augue ac ante rutrum sed the is sodales augue consequat.',
    ARRAY['https://brightwingstravel.in/images/blog/blog-d-1-2.jpg', 'https://brightwingstravel.in/images/blog/blog-d-1-3.jpg'],
    'The is ipsum dolor sit amet consectetur adipiscing elit. Fusce eleifend porta arcu In hac habitasse the is platea augue thelorem turpoi dictumst. In lacus libero faucibus at malesuada sagittis placerat eros sed istincidunt augue ac ante rutrum sed the is sodales augue consequat.',
    'Pellentesque sollicitudin congue dolor non aliquam. Morbi volutpat, nisi vel ultricies urnacondimentum, sapien neque lobortis tortor, quis efficitur mi ipsum eu metus. Praesent eleifend orci sit amet est vehicula.',
    'Consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore of magna aliqua. Ut enim ad minim veniam, made of owl the quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea dolor commodo consequat. Duis aute irure and dolor in reprehenderit.',
    ARRAY['Travel', 'Services', 'Agency']
FROM (VALUES
    ('supervisor-disapproved-of-latest-work', 'Supervisor Disapproved of Latest Work.', '2026-03-17', 'blog-1-1.jpg'),
    ('the-surfing-man-will-blow-your-mind', 'The Surfing Man Will Blow Your Mind', '2025-12-15', 'blog-1-2.jpg'),
    ('get-best-advertiser-in-your-side-pocket', 'Get Best Advertiser In Your Side Pocket', '2026-02-20', 'blog-1-3.jpg'),
    ('supervisor-disapproved-of-latest-work-2', 'Supervisor Disapproved of Latest Work.', '2026-02-27', 'blog-1-4.jpg'),
    ('get-best-advertiser-in-your-side-pocket-2', 'Get Best Advertiser In Your Side Pocket', '2025-12-15', 'blog-1-5.jpg'),
    ('sakura-dreams-and-samurai-tales', 'Sakura Dreams And Samurai Tales.', '2026-02-20', 'blog-1-6.jpg')
) AS s(slug, title, published_on, cover)
ON CONFLICT (slug) DO NOTHING;
