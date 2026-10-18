# Playbook: TripAdvisor (things to do, restaurant sanity-check)

## Access
WebSearch `tripadvisor <city> things to do` / `tripadvisor <restaurant> <city>`, WebFetch
the page; or claude-in-chrome for the live "Things to Do" ranking. Decline cookie banners.

## Extract
Ranked attractions, rating, review count, "traveler favorite" tags; for restaurants:
cuisine, price, rating, whether reservations are recommended.

## Use
Cross-check gog Places ratings against TripAdvisor to avoid tourist traps (profile:
fresh ingredients, complex flavours). Deprioritize spots that are high-volume but
low-quality. Write keepers into `research{}`.

## Flag advance-booking
Reservation-recommended restaurants and timed attractions → `bookings[]` with a deadline.
