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
- :books: :book: for headers and general book references
- :calendar: for dates and deadlines
- :brain: :bulb: for factoids and discussion questions
- :link: :paperclip: for links sections
- :sparkles: for highlights and special callouts
- :thought_balloon: for eve questions and reflections
- :studio_microphone: for podcast and interview references
- :raised_hands: for calls to action
- :alarm_clock: for reminders and countdowns

**Never:** :fire: :100: :exploding_head: or any emoji that reads as hype

## Formatting

Use Slack mrkdwn syntax:
- `*bold*` for emphasis and section headers
- `_italic_` for book titles and author names
- `>` for pull quotes or highlight blocks
- `• ` (bullet + space) for list items
- **Links**: use a short label plus the full URL (see Links below). Do **not** use Slack-only `<url|Display Text>`; it does not render when copy-pasted outside Slack
- `` `code` `` only for literal commands or technical references

### Punctuation in generated copy

Rules apply to **text you write for members** (filled-in hooks, factoids, reminders, eve questions, article blurbs, CTAs, and any other prose in Slack messages). Reference docs and comments for authors may use normal technical punctuation.

- **Do not use em dashes** (—) in that member-facing prose. They tend to read as generic machine tone in chat.
- **Prefer instead:** commas, a period plus a short follow-on sentence, a colon, parentheses, or (for tight metadata) the middle dot (·) where this guide already recommends it.

### Paragraph Length
Keep paragraphs to 2-3 lines max. Slack messages with dense text blocks get skipped.

### Section Separation
Use blank lines between sections. Don't use horizontal rules (Slack doesn't render `---` as dividers in messages).

## Message Length

| Type | Target Length |
|------|-------------|
| Announcement | 120-180 words |
| Reminder | 80-120 words |
| Articles roundup | 100-150 words |
| Eve | 120-180 words |

## Structure

Every message follows: **Hook -> Body -> CTA**

1. **Hook** (1-2 sentences): Grab attention immediately. Lead with the most interesting angle
2. **Body**: Deliver the core content in scannable sections
3. **CTA** (call to action): End with a clear ask: react, reply in thread, or click a link

## Links

- Use **one labeled URL per line** so the message stays readable when copied into email, docs, or chat tools that are not Slack. Slack auto-linkifies bare `https://` URLs.
- Pattern: `*Label:* https://...` or `Label: https://...` (bold the label when it is a section row)
- Group links under a :link: or :paperclip: header
- **Avoid** `<url|Display Text>` mrkdwn; it only works inside Slack and pastes as opaque angle-bracket text elsewhere
- Example block:

```
:link: *Get the book*
Amazon.de: https://www.amazon.de/...
buch7: https://www.buch7.de/...
Medimops: https://www.medimops.de/...
Goodreads: https://www.goodreads.com/...
```

## Mobile-First Spacing

Most readers view these messages on phones. Optimize for vertical compactness:

- Prefer inline separators (`·`) over bullet lists for short metadata (e.g., dates). Keep **links on separate lines**, not chained with `|`
- Limit blank lines to 1 between sections. Never use double blank lines
- Target **15 visible lines or fewer** on mobile per message
- Merge related short sections (e.g., dates + factoids) rather than giving each its own header
- Use single-line CTAs instead of multi-line sign-offs

## Accessibility

- Always describe what images show if referencing visual content
- Don't rely on emoji alone to convey meaning; pair with text
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
