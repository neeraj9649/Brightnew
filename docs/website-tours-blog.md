# Website tours, blog and contact form

The `bright/` website loads tour content from the API. The `BrightP/` admin portal manages it under **Tours**.

## Tour catalogue

| Package type | Website placement |
|---|---|
| Individual package | `/experiences`, and Top Experiences on the matching destination page. Featuring it also puts it in the home page Featured Experiences section. |
| Holiday package | `/packages` and up to three cards in Featured Holiday Packages on the matching destination page, with featured packages shown first. |

Destination pages show each catalogue section only when the API returns published packages of that type for the destination.

Both types use `/packages/{id}` for the detail page, where `id` is the tour's stable UUID. A title change does not change the URL. A draft or hidden tour does not appear on public lists or resolve by UUID.

The editor requires a package type, card title and card image. The detail heading can have a different title and hero image. Location controls destination filters and is optional, as are duration, category and audience. The overview, highlights, gallery, hotels, travel information, activities and FAQs are optional. Empty sections and their tabs are omitted. Create a package as a draft, then publish it from the editor or the catalogue.

Ordering starts with the display order configured in admin, with older records first for ties. The public listings fetch published database records without a local tour seed fallback. Migration `0040_tour_catalog.sql` adds the classification and presentation fields. Older records lack a classification and are outside the new catalogue. Existing slug-based review and booking routes still use their existing contract.

## API

- `GET /public/tours?package_type=individual|holiday&limit=15&offset=0` returns card data and the total. Optional `location` and `featured=true` filters can be combined.
- `GET /public/tours/id/{id}` returns the published tour details, including optional presentation data. Unknown and hidden tours return 404.
- Admin `GET /admin/tours/items?catalog=true` lists new catalogue tours including drafts. `POST /admin/tours/items` creates a tour, `PUT /admin/tours/items/{id}` edits it, and `PATCH /admin/tours/items/{id}/publication` sets its publication state.
- `GET /public/tours/{slug}`, `GET /public/tour-locations`, `POST /public/tours/{slug}/reviews`, `GET /public/tour-reviews` and `/admin/tours/reviews` retain the existing slug and moderation flows. Reviews appear publicly after approval.
- `POST /public/tours/{slug}/booking` sends a quotation email to `BOOKING_TO_EMAIL` (default `info@brightwingstravel.com`). The current website detail form opens WhatsApp with the selected package and traveller details.

## Blog and contact

| Website part | Admin portal | API |
|---|---|---|
| Blog posts and comments | **Blog** | `GET /public/blog`, `GET /public/blog/{slug}`, `POST /public/blog/{slug}/comments`, and `/admin/blog/*` |
| Contact form | Email to `ENQUIRY_TO_EMAIL` | `POST /public/enquiries` |

Blog comments are pending until approved. Admins can hide posts and reject comments.
Migration `0041_clear_blog_data.sql` clears existing blog posts and comments once at backend start-up. The admin can create new posts afterward.

## Deployment

1. Deploy the backend first so its start-up migration adds the catalogue fields and it exposes the UUID detail API. Allow the website's exact origins in the API's CORS settings.
2. Deploy the `BrightP/` admin portal.
3. Run the production build in `bright/` and deploy `dist/`, including its `.htaccess`. The SPA fallback serves direct visits to `/packages/{id}` and `/experiences`. The public catalogue defaults to `https://bp.nsiif.in`. Use `VITE_TOURS_API_URL` to target another API.
