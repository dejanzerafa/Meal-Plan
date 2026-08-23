# SoulGainz — Waitlist to Launch Plan
**Target Launch Date: September 1, 2026**
Today: August 23, 2026 — 9 days out

---

## Overview

SoulGainz goes from **waitlist-only** to **public launch** on September 1. The app is a PWA (no App Store submission needed), so launch = flipping access gates, publishing content, and driving installs.

---

## Phase 1: Pre-Launch Polish (Aug 23–26)

### App

- [x] 18 new low-fat recipes added to PENDING_RECIPES (m88–m103, v10–v11)
- [x] All existing recipes audited for fat content — oils reduced/removed across 72+ recipes
- [x] Recipe step text cleaned (47 oil references updated to non-stick methods)
- [x] Macro consistency check — hol7 and m94 kcal corrected
- [x] Service worker v193 deployed

**Remaining before Aug 26:**
- [ ] Release the 18 pending recipes: move IDs from `RECIPE_TIER_PENDING` → `RECIPE_TIER_MONTHLY` or `RECIPE_TIER_ANNUAL` as appropriate. Suggested split:
  - Monthly tier: m88, m89, m91, m92, m95, m96, m100, m101, m103, v11
  - Annual tier: m90, m93, m94, m97, m98, m99, m102, v10
- [ ] Final check on waitlist page copy — make sure CTA is compelling for Sept 1
- [ ] Add "Launching September 1" countdown or teaser to waitlist page

### SSL / Instagram bio
- SSL cert is valid (Let's Encrypt, expires Oct 4 2026). The intermittent "not trusted" warning in Instagram's in-app browser is caused by the ECDSA (YE2) intermediate not being trusted by older Android WebViews.
  - **Fix**: In Netlify → Domain settings → HTTPS → request RSA certificate provisioning (contact Netlify support or upgrade plan). This has the widest device compatibility.
  - **Workaround in the interim**: Instagram bio link is correct (`soulgainz.app/waitlist`). Users who see the warning can tap "Continue anyway" or open in their default browser.
- [ ] Submit soulgainz.app to Netlify support for RSA cert option

---

## Phase 2: Content Prep (Aug 25–29)

### Instagram Content to Schedule

**Aug 25 (Mon)** — "It's almost here" teaser
- Story: Countdown to Sept 1 with recipe card visual
- Feed post: "5 reasons to stop counting calories manually" → solution tease

**Aug 27 (Wed)** — Product showcase
- Reel: 30-sec screen recording of the meal plan builder in action
- Story: Poll — "What's your biggest meal prep struggle?" (engagement bait)

**Aug 29 (Fri)** — Final push
- Story: "48 hours left on the waitlist. Spots are limited." (urgency)
- Feed post: Before/after recipe comparison (old fatty recipe vs new low-fat version)

**Aug 31 (Sun)** — Launch eve
- Story: "Tomorrow. 🔥"
- Email to waitlist: "You're in — SoulGainz launches tomorrow"

### Email (waitlist to subscribers)

**Email 1 — Aug 29:** "Your early access is confirmed for Sept 1"
- Personal tone, what they'll get, what's changed since waitlist opened
- Include one recipe as a teaser

**Email 2 — Sept 1 (launch day):** "SoulGainz is live — here's your link"
- Direct install link: soulgainz.app
- How to install (PWA steps for iOS/Android)
- Their free tier access is active

---

## Phase 3: Launch Day — September 1

### App Gates to Flip

1. **Remove waitlist gate**: Change the landing page CTA from "Join Waitlist" → "Get Started Free"
2. **Release pending recipes**: Move `RECIPE_TIER_PENDING` IDs to appropriate tier sets (see Phase 1)
3. **Open free tier fully**: Confirm free recipes are accessible without sign-in

### Deploy Checklist (Sept 1 morning)
- [ ] Update landing.html — remove waitlist messaging, add "Get Started" CTA
- [ ] Release 18 pending recipes (update RECIPE_TIER_PENDING → empty, move IDs to tiers)
- [ ] Deploy to Netlify (auto-deploy process: run `npx @netlify/mcp@latest` from SoulGainz folder)
- [ ] Bump sw.js cache version
- [ ] Verify app loads correctly on iOS Safari + Android Chrome
- [ ] Verify Stripe checkout flow works end-to-end

### Go-Live Communications
- [ ] Post on Instagram: "We're live 🚀" — reel + story
- [ ] Send launch email to full waitlist
- [ ] Update Instagram bio: remove "waitlist" → direct to app
- [ ] Post in any fitness communities / forums you're active in

---

## Phase 4: Post-Launch (Sept 2–7)

### Monitoring
- [ ] Check Netlify analytics for traffic spike
- [ ] Monitor Supabase auth for sign-up rate
- [ ] Check Stripe for first paid conversions
- [ ] Read any DM/comment feedback and action quickly

### Week 1 Targets
- 200+ installs
- 50+ sign-ups (free tier)
- 5+ paid subscribers (monthly or annual)

### Quick Wins if Traffic is Low
- DM waitlist members individually to congratulate them + ask for feedback
- Post a "Day 1 recap" story showing user numbers (social proof)
- Reach out to 3–5 fitness/nutrition micro-influencers for a collab or review

---

## SSL Issue Resolution (Ongoing)

The ECDSA certificate from Let's Encrypt's "YE2" intermediate can trigger "certificate not trusted" warnings in:
- Instagram in-app browser on Android < 10
- Some older Samsung internet browsers
- WhatsApp's in-app browser

**Options:**
1. **Contact Netlify support** — request RSA cert provisioning (free on Pro plan)
2. **Add a redirect via link-in-bio tool** (like Linktree or direct.me) which has a well-trusted RSA cert — the link-in-bio page redirects to soulgainz.app
3. **Add to bio text**: "If link doesn't open, copy & paste soulgainz.app into your browser"

---

## App Readiness Checklist

### Recipes
- [x] 171 existing recipes audited (fat reductions applied)
- [x] 18 new recipes staged (pending release)
- [ ] 18 pending recipes released to tiers

### Core Features
- [x] Meal plan builder
- [x] Recipe browser + swap
- [x] Macro tracking
- [x] Subscription tiers (Free / Monthly / Annual)
- [x] PWA install flow
- [x] Stripe checkout
- [x] Supabase auth

### Marketing
- [x] landing.html — marketing page live
- [x] waitlist.html — capturing emails
- [x] install.html — PWA install guide
- [x] pricing.html — tier breakdown
- [ ] Launch day content scheduled

---

## Key URLs

| Page | URL |
|------|-----|
| App | https://soulgainz.app |
| Waitlist | https://soulgainz.app/waitlist |
| Install guide | https://soulgainz.app/install |
| Pricing | https://soulgainz.app/pricing.html |
| Marketing site | https://marketing.soulgainz.app |
| Netlify dashboard | https://app.netlify.com/projects/soulgainz |
