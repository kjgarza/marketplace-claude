# Playbook: GetYourGuide (tours & skip-the-line tickets)

Goal: find bookable activities and FLAG which sell out / need advance booking.

## Access
- Prefer WebSearch: `getyourguide <city> <activity>` then WebFetch the result page.
- For live availability use claude-in-chrome: open `https://www.getyourguide.com`,
  search the city, read cards. Decline cookie banners (most privacy-preserving option).

## Extract per activity
title, price, duration, rating/reviews, next available date, "Likely to sell out" /
limited-availability badges, free-cancellation window.

## Flag advance-booking
If an activity shows limited availability, timed entry, or is a known must-book
(e.g. Last Supper / Cenacolo Vinciano in Milan — books out weeks ahead), append to the
trip `bookings[]`: `{ item, needs_advance:true, deadline, url, booked:false }`.

## Safety
Never purchase or enter payment/personal data. Surface the booking link for the human.
