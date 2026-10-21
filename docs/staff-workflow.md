# Staff workflow

**Team.** An admin adds staff at `/admin/employees` → *Invite employee* (name, phone, HR code, optional initial PIN, role).
Staff sign in at `/auth` with phone + 4-digit PIN and land on `/admin`.

**Recording a booking for a customer.** *Bookings → New booking*: search the customer (name, phone or member code, 3+
characters) or register them on the spot (optionally with an initial PIN to hand over), pick the service
(flight, visa, hotel, tour, airport transfer, cruise, insurance, activity, car rental, custom), fill the details.
The booking is stored with `recorded_by` = the staff member; an employee who records a booking is also assigned to it.

**What the customer sees** (their own login, `/bookings/<id>`): status timeline, the quotation, **Documents** (tickets,
vouchers, invoices uploaded by staff – download links), **Your steps** (the checklist staff write for that booking) and
**Messages** to write to the advisor. Customer messages reach the staff who recorded the booking (and whoever is
assigned): they appear in the workspace *Messages* tab and as a "Reply to customer message" follow-up.

**Steps.** Workspace → *Steps*: add the standard steps for the service or your own; tick them off (each completion is
logged in the booking activity).

**Wings.**
- *Automatic*: when a booking is marked completed the customer gets the Wings from the program list (`points_config`,
  admin-editable under Loyalty settings), plus first-booking/referral bonuses.
- *Manual*: workspace → *Wings* → extra Wings with a reason (booking must be confirmed or completed). Staff requests wait in
  **Wings approvals** (`/admin/wings-approvals`, admins only) and are credited when an admin approves; declined requests
  credit nothing. An admin's own request is applied immediately.

**Offers.** Staff and admins publish offers at `/admin/offers` (title, details, badge, code, optional service, dates,
image, published on/off). Live offers show on every customer's Home, on `/offers`, and in an "Offers" section on the
public landing page.

Database: migration `0027_staff_workflow.sql` (`bookings.recorded_by`, `booking_steps`, `wings_requests`, `offers`).
