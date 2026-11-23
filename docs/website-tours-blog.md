# Website tours, blog and contact form

The public website (`Go_Travel_Brightwings/gotur-nextjs-main`, brightwingstravel.in / .com) is a static
Next.js export. Its tours, blog posts and contact form now talk to the backend API (`https://bp.nsiif.in`).

## What is managed where

| Website part | Admin portal page | API | Tables (migration) |
|---|---|---|---|
| Tours page (`/tours/`, 15 per page), home "Most Popular Tours", tour pages (`/tour/<slug>/`) | Admin → **Tours** | `GET /public/tours?limit=15&offset=0[&featured=true]`, `GET /public/tours/{slug}`, `POST /public/tours/{slug}/reviews`; admin `/admin/tours/items`, `/admin/tours/reviews` | `tours`, `tour_reviews` (0038) |
| Blog page, home blog cards, post page (`/blog-details/?slug=`) | Admin → **Blog** | `GET /public/blog`, `GET /public/blog/{slug}`, `POST /public/blog/{slug}/comments`; admin `/admin/blog/*` | `blog_posts`, `blog_comments` (0037) |
| Contact page form | — (e-mailed to `ENQUIRY_TO_EMAIL`) | `POST /public/enquiries` | `enquiries` (0036) |

- Tour reviews and blog comments are saved as `pending` and appear on the website only after an admin approves them.
- Nothing is deleted from the admin pages: tours and posts are hidden (`is_published = false`), reviews and comments rejected.
- A tour's "Show on the home page" tick puts it in the home page slider.
- A tour's link (`slug`) is made from its title when it is created and never changes, so shared links keep working.

## Required nginx rule (tour pages)

Page files exist only for the tours that were in the site when it was built, plus a fallback page `/tour/_/`.
A tour added later in the admin portal has no page file, so nginx must serve the fallback for it. The page reads
the slug from the address and loads that tour from the API.

Add this inside the website's `server { ... }` block and reload nginx:

```nginx
location /tour/ {
    try_files $uri $uri/ /tour/_/index.html;
}
```

Without it, links to newly added tours (and the Share button on them) give a 404. Tour cards use plain links
(not the Next.js client router) for the same reason.

## Deploy order

1. Backend (runs migrations 0036–0038 on start-up).
2. Admin portal (`BrightP`, auto-deploys from `main`).
3. Website: `npm run build` in `gotur-nextjs-main`, upload `build/` without its `cache/` folder, and add the nginx rule above.
