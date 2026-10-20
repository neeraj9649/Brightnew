# Customer ↔ staff association

Every customer can be associated with the staff member who looks after them (`users.associated_staff_id`, plus
`association_source` and `associated_at`). Migration: `0029_staff_association.sql`.

| How the customer got their staff member | `association_source` |
|---|---|
| Added by that staff member (an employee adding a customer is always the staff member) | `staff_added` |
| Signed up with the staff member's **staff code** | `staff_code` |
| Joined through another customer's referral code → same staff member as the referrer | `referral` |
| An admin assigned / changed it | `admin` |
| None of the above | not assigned (NULL) until an admin assigns it |

**Staff code.** A staff member's code is their `referral_code` (shown on their Overview with copy buttons and a ready
sign-up link `…/auth?ref=<CODE>`). The sign-up form accepts "Referral or staff code": a staff code only creates the
association (no Wings are paid to the staff member); a customer's code records the referral exactly as before (the
referrer is paid when the friend's first booking is completed) **and** the new customer inherits the referrer's staff
member. An unknown code, or the code of a deactivated staff member, is rejected.

**Effects.**
- A booking request from an associated customer is assigned straight to their staff member (status `assigned`).
  Admin-recorded bookings for an associated customer go to that staff member too; an employee who records a booking is
  assigned to it.
- Employees see their own customers (associated, or with bookings assigned to them) under Customers; admins see everyone,
  with a Staff column, a "Not assigned" filter, per-customer and bulk **Assign staff**, and the association shown on the
  customer's page.
- Existing bookings are never moved when an association changes.

Existing customers are not associated automatically; assign them from Customers (filter "Not assigned" → select → Assign).
