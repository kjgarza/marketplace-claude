# Playbook: Booking.com (lodging search/compare)

## Access
claude-in-chrome: `https://www.booking.com`, set city + dates + guests, read result cards.
Or WebSearch + WebFetch for a specific property. Decline non-essential cookies.

## Extract per property
name, area/neighborhood, price/night + total, review score & count, free-cancellation,
distance to the trip's anchor (concert venue, old town), breakfast.

## Use
Rank by (review score, location vs anchors, free-cancellation). Present a short list.
Never book or enter card/personal data — surface the link for the human to complete.
