# Website tours, blog and contact form

The `bright/` website loads tour content from the API. The `BrightP/` admin portal manages it under **Tours**.

## Tour catalogue

| Package type | Website placement |
|---|---|
| Individual package | `/experiences`, and Top Experiences on the matching destination page. Featuring it also puts it in the home page Featured Experiences section. |
| Holiday package | `/packages` and up to three cards in Featured Holiday Packages on the matching destination page, with featured packages shown first. |

Destination pages show each catalogue section only when the API returns published packages of that type for the destination.

Both types use `/packages/{id}` for the detail page, where `id` is the tour's stable UUID. A title change does not change the URL. A draft or hidden tour does not appear on public lists or resolve by UUID.

The destination pages are Dubai, Thailand and Jaipur. Select the matching location in the admin tour editor to display the published package on that destination page.

The editor requires a package type, card title and card image. The detail heading can have a different title and hero image. Location controls destination filters and is optional, as are duration, category and audience. The overview, highlights, gallery, hotels, travel information, activities and FAQs are optional. Empty sections and their tabs are omitted. Create a package as a draft, then publish it from the editor or the catalogue.

Ordering starts with the display order configured in admin, with older records first for ties. The public listings fetch published database records without a local tour seed fallback. Migration `0040_tour_catalog.sql` adds the classification and presentation fields. Older records lack a classification and are outside the new catalogue. Existing slug-based review and booking routes still use their existing contract.

## API

- `GET /public/tours?package_type=individual|holiday&limit=15&offset=0` returns card data and the total. Optional `location` and `featured=true` filters can be combined.
- `GET /public/tours/id/{id}` returns the published tour details, including optional presentation data. Unknown and hidden tours return 404.
- Admin `GET /admin/tours/items?catalog=true` lists new catalogue tours including drafts. `POST /admin/tours/items` creates a tour, `PUT /admin/tours/items/{id}` edits it, and `PATCH /admin/tours/items/{id}/publication` sets its publication state.
- `GET /public/tours/{slug}`, `GET /public/tour-locations`, `POST /public/tours/{slug}/reviews`, `GET /public/tour-reviews` and `/admin/tours/reviews` retain the existing slug and moderation flows. Reviews appear publicly after approval.
- `POST /public/tours/{slug}/booking` sends a quotation email to `BOOKING_TO_EMAIL` (default `info@brightwingstravel.com`).
- `POST /public/tour-enquiries/otp` accepts the destination or tour draft and sends a six-digit code to the visitor's phone by SMS through the dedicated six-digit Twilio Verify service configured by `ENQUIRY_VERIFY_SERVICE_SID`. The Quick Enquiry card asks for name and phone and sends the page destination. The detail form includes the published tour's UUID, visitor email, optional travel date and group size.
- `POST /public/tour-enquiries/otp/{challenge_id}/verify` checks the code against the same draft. It saves the enquiry only after verification, then notifies the office. Migration `0045_tour_enquiry_verification.sql` adds the challenge store. Migration `0047_enquiry_sms_verification.sql` stores the Twilio verification SID. The enquiry Verify service must be distinct from the account Verify service. Codes expire in ten minutes, have a five-attempt limit and are bound to the original form fields. Repeating verification for the same recent draft, including after an OTP resend, returns the saved enquiry ID.

### Tour enquiry WhatsApp template

The backend uses `bright_wings_tour_enquiry` (`HX3a61dfb446ff277339f7524eda4c26be`) after Twilio reports WhatsApp approval. Override the SID with `WHATSAPP_TOUR_ENQUIRY_CONTENT_SID` if needed. Verified destination and tour notifications go from `+919252153290` to `+917732957732`, and emails go to `info@brightwingstravel.com`. The office receives the destination or the specific published tour and its website link. Tour emails include the package type and duration when available and use the visitor address as Reply-To.

```text
New tour enquiry from the Bright Wings website

Tour: {{1}}
Name: {{2}}
Email: {{3}}
WhatsApp / phone: {{4}}
Preferred travel date: {{5}}
Travellers: {{6}}

Please contact the visitor to follow up.
```

When the date is blank, the notification says “Not specified”. Migration `0043_tour_enquiry_delivery.sql` stores the tour ID and the Twilio outcome alongside the enquiry.
The tour form confirms submission once the enquiry is saved. Migration `0046_tour_enquiry_reliability.sql` stores pending notifications in PostgreSQL so the worker can resume after a restart. Each failed send can retry up to two times. Accepted channels are skipped on subsequent attempts and delivery errors are recorded for staff follow-up.

For visitors who confirm the WhatsApp notice by verifying the detail enquiry, migration `0044_tour_whatsapp_greetings.sql` stores the WhatsApp number and greeting progress. The backend checks the office message's Twilio status and sends the greeting only after `delivered` or `read`. The greeting uses `bright_wings_tour_greeting` (`HXa35576af9f780a4216a7dd8b1c351c47`), with the visitor's name as variable 1. Override this with `WHATSAPP_TOUR_GREETING_CONTENT_SID` if needed. Pending greetings are checked for up to 48 hours. A greeting send is attempted once to avoid duplicates.

## Blog and contact

| Website part | Admin portal | API |
|---|---|---|
| Blog posts and comments | — | `GET /public/blog`, `GET /public/blog/{slug}`, `POST /public/blog/{slug}/comments`, and `/admin/blog/*` |
| Contact form | Email to `info@brightwingstravel.com` | `POST /public/enquiries` |

The contact form sends the visitor's name, email, full phone number, subject and message. The API saves the enquiry first and emails it using `ENQUIRY_SMTP_*` with the visitor's email as Reply-To. The form confirms that the message was sent only if the API returns `email_sent: true`. If SMTP fails, the saved enquiry remains available in the database and the visitor sees a delivery notice.

Migration `0042_enquiry_subject.sql` adds the stored subject. Older submitters can omit it, in which case the API uses “General Enquiry”. For local development, set `VITE_PUBLIC_API_URL` in `bright/` to the backend base URL.

Blog comments are pending until approved. The backend still supports hiding posts and moderating comments through the admin API. The admin portal has no Blog page.
Migration `0041_clear_blog_data.sql` clears existing blog posts and comments once at backend start-up. New posts can still be created through the admin API.

## Deployment

1. Deploy the backend first so its start-up migration adds the verification table and exposes the OTP routes. Deploy the website immediately after the backend because the old direct tour enquiry endpoint has been replaced. Allow the website's exact origins in the API's CORS settings.
2. Deploy the `BrightP/` admin portal.
3. Run the production build in `bright/` and deploy `dist/`, including its `.htaccess`. The SPA fallback serves direct visits to `/packages/{id}` and `/experiences`. The public catalogue defaults to `https://bp.nsiif.in`. Use `VITE_TOURS_API_URL` to target another API.
   Upload the hashed `assets/`, `js/` and `css/` files before publishing the new `index.html`. The homepage video and its poster are included in `assets/`. The original recording is stored locally under `bright/media-source/` outside the deployment artifact. Flush the Hostinger CDN cache after publishing if the site still serves old asset responses.
