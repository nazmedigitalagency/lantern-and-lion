# Lantern & Lion — SEO Strategy & Implementation Reference

Production origin (until a custom domain is attached): `https://lanternandlion.vercel.app`

This document is the living reference for how Lantern & Lion is structured for search. It should be updated whenever a public route, keyword focus, or content section changes.

## 1. Primary keyword clusters

Grouped by realistic ranking opportunity (long-tail first, broad terms treated as aspirational):

| Cluster | Terms | Priority |
|---|---|---|
| Kids Bible games | Bible games for kids, Bible learning games, Bible activities for kids | High — strong existing product fit (`/arcade`, `/curriculum`) |
| Sunday school / ministry | Bible games for Sunday school, children's ministry games, Bible games for church, Christian classroom games | High — dedicated `/churches` page already exists |
| Teen Bible games | Bible games for teens, Christian games for teens, Bible learning games for teenagers | Medium — distinct teen product experience exists but only one flagship page (`/teen-access`) |
| Bible learning app | Christian learning app for kids, Bible app for kids | Medium — commercial intent, competitive |
| Safety | Safe Bible app for children, Christian kids app safety | Medium — trust-building, low competition |
| Christian parenting content | Fun ways to teach Bible verses, how to make Bible reading fun for kids | Long-tail, blog-driven |
| Broad terms ("Bible", "Bible games") | Deliberately not targeted directly — too competitive for a new domain; ranked for indirectly through the clusters above |

## 2. Search intent by cluster

- **Kids Bible games / Sunday school / teen games** — mostly informational-to-navigational ("what is this, can my kid/class use it"), some commercial intent from parents/leaders comparing options.
- **Bible learning app / Christian learning app** — commercial investigation intent (comparing apps).
- **Safety terms** — trust/reassurance intent, usually late in the decision funnel.
- **Blog / parenting terms** — informational intent, top-of-funnel; the entry point for many first-time visitors.

## 3. Page → keyword map

| Page | Primary topic | Secondary terms |
|---|---|---|
| `/` | Christian Bible learning games for kids & teens | Bible play for growing minds, Christian games for kids |
| `/about` | Christian Bible learning mission | Faith formation for children, Christian family values |
| `/curriculum` | Bible curriculum for kids & teens | Bible stories by age, Sunday school curriculum |
| `/curriculum/[id]` (88 pages) | Individual Bible lesson (e.g. "God Made the Big Beautiful World") | Specific Bible book/passage, age band |
| `/arcade` | Bible games for kids | Bible quizzes, Bible memory games, Bible games online |
| `/learn` | Bible learning activities for kids | Bible reading activities, creative Bible activities |
| `/multiplayer` | Bible team games for families & groups | Bible games for church, classroom Bible games |
| `/churches` | Bible games for Sunday school / children's ministry | Christian classroom games, Bible games for church |
| `/safety` | Safe Bible app for kids | Child-safe learning apps, parent-controlled Christian apps |
| `/blog` + posts | Long-tail informational content | See cluster table above |

Deliberately **not** keyword-optimized: private/authenticated screens (dashboards, sign-in flows, in-session gameplay) — see §5.

## 4. Public URL structure

```
/                          marketing homepage
/about                     mission page
/curriculum                curriculum overview (88 modules, client-rendered browse/filter UI)
/curriculum/[id]           NEW — one crawlable page per module (SSG, generateStaticParams)
/arcade                    games hub (public landing/index)
/learn                     learning activities hub
/multiplayer               team games landing + live session (same route, public copy above the fold)
/churches                  churches & schools landing
/safety                    safety/trust page
/blog                      NEW — content index
/blog/[slug]               NEW — 5 seed articles (SSG)
```

## 5. Sitemap & robots rules

- `app/sitemap.ts` — dynamically emits the 9 static public routes + all 88 `/curriculum/[id]` pages + all `/blog/[slug]` posts (102 URLs at time of writing). Pulls directly from `curriculum-data.ts` and `blog-data.ts`, so it never drifts from the actual dataset.
- `app/robots.ts` — allows `/` by default, explicitly disallows: `/api/`, all sign-in/access routes, all dashboards, `/family-setup`, `/onboarding`, `/daily-quests`, `/character`, `/adventure`, and all 8 individual arcade **gameplay** routes (which require an active player profile and show personalized state). Points to the sitemap and sets `host`.
- The arcade **index** (`/arcade`) stays crawlable — it's the public games hub; the 8 individual game routes underneath it are gameplay screens and stay blocked.

## 6. Canonical strategy

- `app/lib/site.ts` exports `SITE_URL`, sourced from `NEXT_PUBLIC_SITE_URL` with a hardcoded fallback to the known production Vercel URL (`https://lanternandlion.vercel.app`) — **not** `process.env.VERCEL_URL`, which changes per-deployment (previews) and would have made preview builds canonical-eligible.
- `metadataBase` in `app/layout.tsx` uses `SITE_URL`, so every relative OG/Twitter image and every `alternates.canonical` resolves against the stable production origin regardless of which environment built the page.
- Every public page sets an explicit `alternates: { canonical: '/path' }`.
- **Action needed from you:** once a custom domain is attached in Vercel, set `NEXT_PUBLIC_SITE_URL=https://<your-domain>` in the Vercel project's environment variables (all environments, or at least Production) and this file needs no further changes — the fallback stays as a safety net only.

## 7. Metadata architecture (why the file changes look the way they do)

Every route in this app was a `'use client'` component, which cannot export `metadata`/`generateMetadata` in the App Router. Rather than rewriting pages to be server components (high regression risk on interactive dashboards/games), each route was split:

- `<Route>/page.tsx` — new, small **server** component: exports `metadata`, renders the client component. Zero UI change.
- `<Route>/<Name>Client.tsx` — the original file, renamed, untouched otherwise (`'use client'` and all existing logic preserved exactly).

Public pages got full title/description/OG/Twitter/canonical metadata. Private/app pages (dashboards, sign-in, character creator, adventure map, daily quests, family setup, individual gameplay screens) got a minimal `metadata` with `robots: { index: false, follow: false }` — they still render normally for logged-in users, they're just not offered to search engines.

## 8. Structured data implemented

- **Organization** + **WebSite** JSON-LD in the root layout (every page).
- **LearningResource** + **BreadcrumbList** JSON-LD on each `/curriculum/[id]` page.
- **Article** + **BreadcrumbList** JSON-LD on each `/blog/[slug]` page.

Not implemented (no real backing content, so skipped rather than faked): AggregateRating/Review, Product/price, FAQPage (would require writing new visible FAQ copy into pages, which was judged out of scope for a "surgical" pass — see §11).

## 9. Internal linking

- All 5 major public pages (`/`, `/about`, `/curriculum`, `/safety`, `/churches`) now link to `/blog` from their footer "Explore" section.
- Each `/curriculum/[id]` page links back to `/curriculum`, links to 3 related lessons in the same age track, and CTAs to `/parent-access`.
- Each `/blog/[slug]` post links to 2-3 relevant product pages (contextual, not generic) and to 1-2 related posts in the same category.
- The `/blog` index links to every post; every post links back to `/blog`.

## 10. Content/blog architecture

- `app/blog-data.ts` — typed post data (title, description, category, sections, related links). Adding a post = adding one object; `generateStaticParams` and the sitemap both pick it up automatically.
- 5 seed articles shipped, one per priority cluster: kids Bible games, Christian parenting, Sunday school, Bible memory verses, teen Bible games. Each is original, non-generic, and cross-links to real product pages — not thin AI filler.

## 11. Deliberately deferred (future opportunities, not done in this pass)

These were in scope per the brief but judged too invasive or too content-heavy for a single surgical pass without visible-design review from you first:

1. **Dedicated public landing pages per arcade game** (e.g. a marketing page for Scripture Maze separate from the gameplay screen at `/arcade/scripture-maze`). The existing route serves gameplay directly and several games assume an active player profile; building 8 new landing pages at new routes (or restructuring existing ones) needs a routing decision from you first.
2. **FAQPage structured data** — needs real, visible FAQ copy added to page bodies first (safety, parents, churches). Didn't want to insert new visible sections without sign-off, since that changes page content, not just metadata.
3. **Image optimization** — curriculum artwork in `/public` is 800KB–1.1MB per JPG, unoptimized. Worth a follow-up pass (convert to AVIF/WebP via `next/image`, since the code already uses `<Image>` for most of these).
4. **`favicon.svg` was already unused** — fixed to be the primary icon; the 1.9MB PNG logo is now only the Apple/shortcut icon, but it's still large and worth compressing.
5. Expanding blog content beyond the 5 seed posts — a steady cadence (2-4/month) against the remaining clusters in the brief.

## 12. Search Console readiness

- Sitemap: `https://lanternandlion.vercel.app/sitemap.xml` ✅ live after deploy.
- Robots: `https://lanternandlion.vercel.app/robots.txt` ✅ live after deploy.
- **Manual step required:** verify the property in Google Search Console (Domain or URL-prefix). Easiest path — add a DNS TXT record if verifying the apex domain, or use the HTML-tag method: Google gives you a `<meta name="google-site-verification" content="...">` tag; add it to `app/layout.tsx`'s `metadata.verification.google` field (Next.js supports this natively) and redeploy, then click verify. Do not fabricate or guess a verification code — get the real one from Search Console first.
- Submit the sitemap URL inside Search Console once verified.
