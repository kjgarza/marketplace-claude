# Slack Style Guide

Voice and formatting rules for all book club Slack messages.

## Tone

**Enthusiastic but not cheesy. Smart-casual.** Think "the friend who always has great book recommendations." Warm, inclusive, occasionally witty. Never condescending, never overly academic.

Good: "This one's been on every 'must-read' list for a reason"
Bad: "This seminal work of literary fiction demands your immediate attention"
Bad: "OMG you HAVE to read this!!!! SO GOOD!!!!"

## Emoji Usage

Use 2-4 relevant emojis per message. Place them at section headers and key transition points, not scattered throughout body text.

**Preferred emojis:**
- :books: :book: — headers, general book references
- :calendar: — dates and deadlines
- :brain: :bulb: — factoids, discussion questions
- :link: :paperclip: — links sections
- :sparkles: — highlights, special callouts
- :thought_balloon: — spark questions, reflections
- :studio_microphone: — podcast/interview references
- :raised_hands: — calls to action
- :alarm_clock: — reminders, countdowns
- :memo: — recaps, summaries

**Never:** :fire: :100: :exploding_head: or any emoji that reads as hype

## Formatting

Use Slack mrkdwn syntax:
- `*bold*` for emphasis and section headers
- `_italic_` for book titles and author names
- `>` for pull quotes or highlight blocks
- `• ` (bullet + space) for list items
- `<url|Display Text>` for all links
- `` `code` `` only for literal commands or technical references

### Paragraph Length
Keep paragraphs to 2-3 lines max. Slack messages with dense text blocks get skipped.

### Section Separation
Use blank lines between sections. Don't use horizontal rules (Slack doesn't render `---` as dividers in messages).

## Message Length

| Type | Target Length |
|------|-------------|
| Announcement | 120-180 words |
| Reminder | 80-120 words |
| Spark questions | 100-150 words |
| Articles roundup | 100-150 words |
| Session recap | 120-180 words |

## Structure

Every message follows: **Hook -> Body -> CTA**

1. **Hook** (1-2 sentences): Grab attention immediately. Lead with the most interesting angle
2. **Body**: Deliver the core content in scannable sections
3. **CTA** (call to action): End with a clear ask — react, reply in thread, click a link

## Links

- Always format as `<url|Display Text>` — never paste raw URLs
- Group links in a dedicated section with a :link: or :paperclip: header
- Separate multiple links with ` | ` (space-pipe-space)
- Example: `<https://www.amazon.de/...|Amazon.de> | <https://www.buch7.de/...|buch7> | <https://www.medimops.de/...|Medimops> | <https://goodreads.com/...|Goodreads>`

## Mobile-First Spacing

Most readers view these messages on phones. Optimize for vertical compactness:

- Prefer inline separators (`·`, `|`) over bullet lists for short items (e.g., dates, links)
- Limit blank lines to 1 between sections — never use double blank lines
- Target **15 visible lines or fewer** on mobile per message
- Merge related short sections (e.g., dates + factoids) rather than giving each its own header
- Use single-line CTAs instead of multi-line sign-offs

## Accessibility

- Always describe what images show if referencing visual content
- Don't rely on emoji alone to convey meaning — pair with text
- Use clear link text (not "click here")

## Block Kit JSON Guidelines

When generating Slack Block Kit JSON:
- Use `section` blocks for main content with `mrkdwn` text
- Use `divider` blocks between major sections
- Use `context` blocks for metadata (dates, page counts, sources)
- Use `actions` blocks for buttons (purchase links, RSVP)
- Use `image` blocks for cover art (with alt text)
- Ensure the JSON is valid and pasteable into https://app.slack.com/block-kit-builder
- Keep total blocks under 50 (Slack's limit)
