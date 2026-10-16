# Bright Wings Elite Card – Bonus Card Program

Implemented by `backend/migrations/0028_bonus_card_program.sql` plus the tier logic in
`backend/src/modules/rewards/src/domain/tier_config.rs`.

## Earning points (`points_config`, editable in Admin → Loyalty settings)
| Action | Points |
|---|---|
| New member registration (welcome bonus) | 200 |
| First booking | 300 |
| Refer a friend (after the friend's first booking) / booking received through referral | 50 |
| Air ticket booking | 100 |
| Visa service | 200 |
| Activity ticket booking | 50 |
| Airport pickup / drop service | 50 |
| Tour package booking | 500 |
| Holiday package booking | 500 |
| Car hire | 100 |
| Office visit (staff add it from the booking Wings tab / admin award) | 100 |

Hotel (100), cruise (500), insurance (50) and custom (500) are not in the program leaflet and keep their previous values.

## Rewards catalogue ("Value of your reward points")
1,000 Free Dhow Cruise · 5,000 Free Desert Safari · 7,500 MOTF Ticket · 10,000 Silver Membership + Free Musandam Tour ·
20,000 Gold Membership + Free Air Ticket to Home Country · 50,000 Platinum Membership + Free Family Tour Package (1 member only, 3 Nights / 4 Days).
The migration adds these (or updates them if the name already exists) and **deactivates** every other catalogue item
(nothing is deleted – past redemptions keep working). Validity (90/180/365 days) and terms can be edited in Admin → Rewards.

## Membership levels (by lifetime points – redeeming never lowers a level)
| Level | Eligibility | Benefits |
|---|---|---|
| Member | joins (200 welcome points) | earn and redeem Wings |
| Silver | 10,000 points | Free Musandam Tour · Priority Customer Support · Exclusive Travel Offers |
| Gold | 20,000 points | Free Air Ticket · Priority Booking Assistance · Special Discounts on Selected Packages · All Silver benefits |
| Platinum | 50,000 points | Free Family Holiday Package · VIP Customer Support · Premium Travel Benefits · Exclusive Seasonal Promotions · All Gold & Silver benefits |

New sign-ups start as **Member**; the migration re-levels every existing user from their lifetime points (so a former
"Silver" with fewer than 10,000 points becomes Member, "Titanium" is retired and becomes Platinum). Thresholds can be
overridden with `TIER_THRESHOLD_SILVER|GOLD|PLATINUM`.
