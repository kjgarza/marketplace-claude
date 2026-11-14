# berlin-flats: PR/FAQ

A working-backwards document. The press release describes the plugin as it is **intended** to
be; none of it is a claim about today. For today, see [README.md](README.md). Written
2026-11-14 from the probe evidence in
[docs/2026-11-14-probe-evidence.md](docs/2026-11-14-probe-evidence.md).

---

## Press release

### berlin-flats tells you about the right Berlin flat within minutes and has your application ready when you open it

**Berlin.** Finding a flat in Berlin is a race. A good listing can collect hundreds of
inquiries in its first hours, and landlords often stop reading after the first few dozen. The
people who win are not the best tenants; they are the ones who saw the ad first and replied
with a complete, credible message. berlin-flats is a personal assistant that runs on your own
Mac and makes you one of those people without you refreshing five websites all day.

It watches the places Berlin flats actually appear: the big portals, classifieds, and the
state-owned housing companies that hold about one in four flats in the city. When something
new shows up, it throws away the swap offers, sublets, wanted-ads and scams, checks the rest
against what you want, and scores each one from 0 to 100 with reasons. If a flat clears your
bar, your phone buzzes with the essentials, the score, a scam verdict, and a German message
already written in your voice for that specific flat.

You tap through, read the draft, and send it yourself. berlin-flats never sends anything, fills
in a form, or creates an account for you. It also never tries to sneak past a website's bot
protection. Where a portal refuses automated visitors, it uses the portal's own saved-search
alerts, delivered to your inbox, or your own logged-in browser.

"I was spending an hour a day scrolling and still hearing about flats a day late," said the
plugin's first and only user. "Now I hear within minutes, I know why it is a good fit, and the
message is waiting. I just decide."

After you reply, it keeps track: which landlords you contacted, who has not answered, which
viewings are coming, and whether your Schufa and payslips are still fresh enough to hand over.
Every accept and reject teaches it what you actually like, so the ranking improves through the
months before your move.

---

## Customer FAQ

**Who is this for?**
One person: someone planning a move to (or within) Berlin in 2027, with a job, a Schufa record
and no WBS, who wants an unfurnished, open-ended lease.

**What will I actually experience day to day?**
A Telegram message when a matching flat appears, typically a handful a week rather than dozens
a day. Each one has the title, district, size, rooms, cold and warm rent, fit score with the
top reasons, scam verdict, a link, and a draft message. Once a day or so you can run
`/berlin-flats:triage` to go through anything you have not decided on.

**How fast is "within minutes"?**
The target is a median of 30 minutes from publication to your phone, and a draft ready within
15 minutes of that. Today the plugin measures neither, so the first job is to record those
timestamps and find out what each source can really deliver.

**Where does it look?**

| Source | How | Why this way |
|---|---|---|
| Kleinanzeigen | Direct, polite polling | It serves listings to an honest client |
| degewo, GESOBAU, WBM | Direct, polite polling | Plain web pages, no protection |
| ImmoScout24 | Its own saved-search e-mail alert | It blocks scripts; the alert is the sanctioned route |
| Immowelt | Its own saved-search e-mail alert | It blocks scripts too |
| Gewobag | Its own search-agent e-mail | Official feature |
| inberlinwohnen, HOWOGE, Stadt und Land | Your Chrome, when you start a session | They refuse scripts or render in the browser |
| WG-Gesucht | Off by default | Mostly sublets and rooms |

**How many things do I have to sign up for?**
Three free alerts, each a one-time setup you do yourself: an ImmoScout24 saved search, an
Immowelt saved search, and the Gewobag search agent. No paid plan. You also add one Gmail
filter so the alerts land under a label the plugin reads. One saved search per portal is
enough because the plugin does its own filtering; you set the portal's filter broad and let
the plugin be picky. Kleinanzeigen and the other municipal companies need no signup.

**Will it apply for me?**
No. It prepares; you send. It will open the listing, show you the draft and tell you which
fields the form wants (some ask for net income, employment and move-in date), but typing your
personal data and pressing send stay with you. This is deliberate: a wrong message to a
landlord cannot be recalled.

**Will it get my accounts or my internet connection blocked?**
The design avoids the things that cause that: no bursts, no round-the-clock polling, no
retrying after a refusal, no disguising itself as a browser, no proxies, no CAPTCHA solving.
If a source refuses, the plugin stops asking it for the day and tells you.

**What does it need from me?**
Up-to-date search criteria, a short profile (household, income, move-in date, pets, smoker),
and your application documents in a folder: Schufa, three payslips, ID copy,
Mieterselbstauskunft, and ideally an employer letter and a Mietschuldenfreiheit.

**What does my Mac need to be doing?**
Awake during the hours you want it watching. Background watching does not need Chrome; Chrome
with the Claude extension is only needed when you sit down to apply or run a sweep yourself.
A daily digest always arrives, even on a day with no flats, so a missing digest tells you
something is wrong.

**My move is in 2027. Why start now?**
Most Berlin ads are for immediate move-in to about three months out, so the flats you will
apply for do not exist yet. The lead time is for making the system trustworthy: measuring how
fast each source really is, teaching the ranking with your real accept and reject decisions,
and getting the document folder complete. Serious hunting starts about three months before the
move.

**What does it cost to run?**
Fetching and scoring cost nothing beyond electricity. Reading alert e-mails and drafting
messages use Claude; the design caps this at one dollar a day and keeps notifying if the cap is
hit. Actual cost has not been measured yet.

---

## Internal FAQ

**What works today?**
The back half: scam scoring, fit ranking, pipeline states, the dossier check, message drafting,
run telemetry and the Telegram sender. Eighty tests pass.

**What does not?**
The front half. ImmoScout24 has never returned a listing. Kleinanzeigen returns listings
without size or rooms and would re-notify the same ads every run. The municipal source has
never recorded a run. No schedule is installed; the last hunt was in August. In three months
of weekly runs, no usable candidate reached the queue.

**Why did it stall?**
Bot detection was treated as a scraping problem to be engineered around, which led to a
browser-impersonating client and a reader-proxy fallback that still returned nothing from
ImmoScout24. The alternative, saved-search alerts read from the inbox, was decided in July and
never built because it was believed Gmail could not be read by an unattended run. A probe on
2026-11-14 shows an unattended run can see the Gmail tools.

**What is the core design change?**
Stop having one scraper. Have several small channel adapters (direct HTTP, e-mail alert, Chrome
sweep, manual paste) that all hand listings to one ingest function. That function assigns a
canonical ID, drops duplicates including the same flat on two portals, filters junk categories,
scores, and stores. A separate notifier sends whatever has not been notified yet. Each source
uses the channel it permits.

**Is Chrome computer use the answer to bot detection?**
Partly. In testing, the user's own Chrome loaded all five portals tried, with one
self-clearing interstitial on ImmoScout24. But the sample was three loads over fifteen minutes,
and a scripted poller hammering a protected portal from a personal browser is the pattern most
likely to get that browser challenged, and it only works while the Mac is awake with Chrome
open. So the recommended default is: background runs use honest HTTP and e-mail alerts only,
and Chrome is used when you are present, to open a listing, read its form, or sweep the
sources that have no alert. A scheduled read-only Chrome sweep stays available as an opt-in if
measured alert latency turns out to be poor.

**What are the biggest risks?**

| Risk | If it happens | How we find out early |
|---|---|---|
| Unattended Gmail read does not work | ImmoScout24 coverage needs you to open a session | One headless read probe before building |
| Portal alerts are slow or batched | "Within minutes" is not achievable on that source | Create one alert, timestamp arrivals for a week |
| Chrome sweeps trigger challenges at real cadence | Municipal aggregator coverage drops to manual | Run the sweep for a week at low frequency first |
| Listings are gone before a human can reply | Speed alone does not win | Track reply rate per source and per response time |
| The Mac is asleep or Chrome is closed | Silent gap in coverage | Liveness alarm and a "needs you" message |

**How will we know it is done?**
The current definition of done ("at least one qualifying listing in the database") does not
test the goal. The replacement measures, per source: share of scheduled runs that returned
listings; share of listings with size, rooms, rent and publication time; publication-to-phone
latency; time to a ready draft; how many of the top five by fit score you would actually
contact; and how much junk gets through.

**What is explicitly out of scope?**
Automatic sending or form submission, account creation, CAPTCHA solving, proxies or
browser disguises, WBS-only flats, buying, shared flats, and serving more than one user.

**What needs a decision from the user?**
The real search criteria (districts, a hard floor for size versus a preference, whether Altbau
is required or a bonus), the move-in date, a single rent ceiling, whether furnished and
temporary lets are excluded, which of the three alerts to create, and whether WG-Gesucht is in.

**What is the order of work?**
Each step starts with a small live probe; the full plan is in
[docs/2026-11-14-design.md](docs/2026-11-14-design.md).

0. Kleinanzeigen notifications you can trust: honest client, one ingest path, fixed IDs,
   verdicts that stick, junk categories filtered, size and rooms extracted, the schedule
   installed.
1. Municipal companies over plain HTTP, a daily digest, and the metrics line.
2. E-mail alerts for ImmoScout24, Immowelt and Gewobag, with cross-portal dedup.
3. Ranking that accounts for scam risk and missing data, a draft on arrival, and an assisted
   `/apply` flow.
4. Calibration on your real decisions.
5. Only if alerts prove slow and you opt in: a scheduled read-only Chrome sweep.
