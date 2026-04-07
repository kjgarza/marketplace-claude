---
# Root folder: each book gets a subfolder `<output_root>/<folder_slug>/` with book-profile.json and bookclub-* outputs.
# Relative paths resolve from the project (workspace) root. Use "." for the workspace root.
output_root: bookclub

# Display name in Slack headers and printed materials
bookclub_name: Tina's Bookclub

# Optional — shorter label for tight UI (buttons, one-pagers)
bookclub_short_name: ""

# Optional — e.g. #book-club (for copy-paste into Slack or runbooks)
slack_channel: "#book-club"

# Optional — default time/place line for reminders when the book profile does not specify it
discussion_venue: "Tuesday Coworking - BelzigerStrasse Kitchenc 1st Floor"

# Optional — contact for facilitators (Slack @handle, email, etc.)
organizer_contact: "Kristian Garza"

# Optional — IANA timezone for schedule copy (e.g. Europe/Berlin)
timezone: "CET"

# When several books exist under output_root, set to one folder name (snake_case title slug, e.g. klara_and_the_sun)
current_book_folder: ""
---

# Book Club Plugin Settings

Copy this file to `.claude/bookclub.local.md` in your **project root** and edit the frontmatter.

Anything below this line is freeform notes for your team; it is not parsed as configuration.
