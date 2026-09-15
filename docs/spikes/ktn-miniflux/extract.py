"""Extract job links from newsletter HTML and derive a stable job_key without following redirects."""
import html, re
from html.parser import HTMLParser
from urllib.parse import parse_qs, urlsplit, urlunsplit, urlencode

NOISE = re.compile(r"unsubscribe|emailsettings|email-preference|privacy|/help|/legal|/about/|manage|"
                   r"apps\.apple|play\.google|/wf/open|/profile/|mailto:|/login|/signup", re.I)
TRACKING = re.compile(r"^(utm_|trk|refid|trackingid|lipi|midtoken|midsig|eid|otptoken|jrtk|cs|cb|guid|ao|s|t|vt|uido|pos|src|rdforyou|ea)$", re.I)
JOBISH = re.compile(r"job|career|position|stellen|vacanc|opening|/jobs?/", re.I)

# Per-source ID rules, checked in order. Each returns an ID string or None.
RULES = [
    ("glassdoor", lambda u, q: q.get("jobListingId", [None])[0]
        or _m(r"-(\d{10,13})$", q.get("utm_content", [""])[0])),
    ("linkedin", lambda u, q: _m(r"/jobs/view/(?:[^/]*-)?(\d+)", u.path) or q.get("currentJobId", [None])[0]),
    ("indeed", lambda u, q: q.get("jk", [None])[0] or q.get("vjk", [None])[0]),
    ("stepstone", lambda u, q: _m(r"--(\d{6,})-inline\.html", u.path) or _m(r"/(\d{6,})(?:$|[/?])", u.path)),
    ("greenhouse", lambda u, q: _m(r"/jobs/(\d+)", u.path) or q.get("gh_jid", [None])[0]),
    ("lever", lambda u, q: _m(r"jobs\.lever\.co/[^/]+/([0-9a-f-]{36})", u.netloc + u.path)),
]

def _m(pattern, s):
    hit = re.search(pattern, s or "")
    return hit.group(1) if hit else None

def repair(href):
    """Undo quoted-printable damage seen in Gmail-API bodies ("=10" decoded to byte 0x10, "=3D" left in)."""
    href = html.unescape(href).replace("=3D", "=")
    return re.sub(r"[\x00-\x1f]", lambda c: "=" + format(ord(c.group()), "02X"), href)

class _Anchors(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links, self._href, self._text = [], None, []
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self._href, self._text = dict(attrs).get("href"), []
    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)
    def handle_endtag(self, tag):
        if tag == "a" and self._href:
            self.links.append((self._href, " ".join(" ".join(self._text).split())))
            self._href = None

def job_key(url):
    u = urlsplit(url)
    q = parse_qs(u.query)
    host = u.netloc.lower()
    for source, rule in RULES:
        if source in host:
            jid = rule(u, q)
            if jid:
                return f"{source}:{jid}", source
    clean = urlencode([(k, v) for k, vs in q.items() if not TRACKING.match(k) for v in vs])
    return "url:" + urlunsplit(("https", host, u.path.rstrip("/"), clean, "")), "generic"

def extract_jobs(content):
    p = _Anchors()
    p.feed(content or "")
    seen, jobs = set(), []
    for raw, text in p.links:
        url = repair(raw)
        if not url.startswith("http") or NOISE.search(url):
            continue
        key, source = job_key(url)
        if source == "generic" and not JOBISH.search(urlsplit(url).path):  # path only: utm_* often says "jobs"
            continue
        if source == "glassdoor" and "SRCH_" in url:  # "search for more jobs" CTA, not a job
            continue
        if key in seen:
            continue
        seen.add(key)
        jobs.append({"job_key": key, "source": source, "url": url, "text": text[:160]})
    return jobs
