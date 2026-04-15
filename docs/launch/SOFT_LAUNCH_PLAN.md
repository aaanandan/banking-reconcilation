# Soft Launch Plan

Banking Reconciliation Platform — Step 278

---

## Soft Launch Overview

**Duration:** 1 week (post-beta, pre-full-launch)
**Target:** 50-100 users
**Goal:** Validate scalability, gather early revenue, build momentum before public launch

---

## Launch Readiness Checklist

### Pre-Launch Validation

- [x] **Step 271:** Load testing passed (100 VUs, p95 <2s) ✅
- [x] **Step 272:** Stress testing passed (breaking point identified at 600 VUs) ✅
- [x] **Step 273:** Failover testing passed (graceful degradation verified) ✅
- [x] **Step 274:** Backup/restore tested (RTO <4 hours) ✅
- [x] **Step 275:** Security audit passed (no P0/P1 issues) ✅
- [x] **Step 276:** Performance optimized (all SLAs met) ✅
- [x] **Step 277:** Beta testing complete (NPS >50, convergence >90%) ✅

### Infrastructure

- [ ] Production environment deployed (AWS ECS + RDS)
- [ ] DNS configured (app.banking-recon.com → ALB)
- [ ] SSL certificate installed (TLS 1.3)
- [ ] Monitoring stack deployed (Prometheus, Grafana, Sentry)
- [ ] Alerts configured (Slack + PagerDuty)
- [ ] Backup automation enabled (daily snapshots, 30-day retention)

### Business Systems

- [ ] Stripe live mode enabled (test mode → production)
- [ ] Payment method on file (for AWS billing)
- [ ] Support email configured (support@banking-recon.com)
- [ ] Knowledge base published (docs.banking-recon.com)
- [ ] Terms of Service & Privacy Policy published
- [ ] GDPR/CCPA compliance verified

---

## Soft Launch Strategy

### Phase 1: Invite-Only (Days 1-3)

**Target audience:**
- 10-15 beta users (already onboarded)
- 30-40 invite requests from landing page waitlist
- 5-10 personal network (advisors, investors, early supporters)

**Activation:**
- Email: "You're Invited — Early Access to Banking Reconciliation"
- Unique invite link (tracks referral source)
- Onboarding email sequence (Day 1, 3, 7)

**Monitoring:**
- User signups: Target 50 users by end of Day 3
- Activation rate: Target 70% (users who complete ≥1 reconciliation)
- Support tickets: <5 per day

---

### Phase 2: Limited Public Access (Days 4-7)

**Public announcement:**
- Blog post: "We're Live (Sort Of)"
- Twitter/LinkedIn: "Soft launch happening now — limited spots available"
- Landing page: Remove waitlist, add "Sign Up" (with capacity warning)

**Capacity limits:**
- Max signups: 100 total
- Display on homepage: "47 / 100 spots remaining"
- Creates FOMO (fear of missing out)

**Growth channels:**
- Product Hunt launch (scheduled for Day 5)
- HackerNews Show HN (Day 4)
- LinkedIn post by founders
- Email to waitlist (500 users): "We're open — join now before we hit capacity"

**Target:**
- 100 users by end of Day 7
- 50+ reconciliations completed
- 10+ paid subscriptions (Starter or Professional)

---

## Monitoring During Soft Launch

### Real-Time Dashboards

**Grafana dashboard: "Launch Metrics"**

Panels:
1. **Signups (last 24h):** Line chart
2. **Active users (last 1h):** Gauge
3. **Reconciliations started:** Counter
4. **Convergence rate (average):** Gauge (target >90%)
5. **Error rate:** Line chart (target <1%)
6. **API response time (p95):** Line chart (target <2s)
7. **Subscriptions created:** Counter by plan

**Alerts:**
- Error rate >5% for 5 minutes → page on-call
- Signup spike (>10 in 5 min) → notify team (good news!)
- API latency >3s for 10 minutes → investigate
- Zero signups for 6 hours → check marketing/DNS

---

### Daily Standup (During Soft Launch)

**Time:** 9 AM daily
**Attendees:** Full team

**Agenda:**
1. **Metrics review** (5 min)
   - Signups: X (target: 15/day)
   - Reconciliations: Y (target: 3/user)
   - Revenue: $Z (target: $500 by Day 7)
   - Bugs: N open (P0/P1 must be 0)

2. **User feedback** (5 min)
   - What are users loving?
   - What are users complaining about?

3. **Priorities for today** (5 min)
   - Fix any P1 bugs
   - Respond to all support tickets
   - Deploy any hotfixes

---

## User Communication

### Welcome Email Sequence

**Email 1: Immediately after signup**

```
Subject: Welcome to Banking Reconciliation! 🎉

Hi [First Name],

You're in! Welcome to the soft launch.

Your Next Steps:
1. Log in: https://app.banking-recon.com
2. Upload your first bank statement + ledger
3. Watch the magic happen

Need help? Reply to this email or check out our guides:
- Getting Started Guide
- Video Tutorial (5 min)

— The Team
```

**Email 2: Day 3 (if no reconciliation yet)**

```
Subject: Need help getting started?

Hi [First Name],

We noticed you haven't uploaded any files yet. No problem — here's a quick guide to get you going:

[Screenshot + 3-step walkthrough]

Prefer a call? Book 15 minutes with our team:
[Calendly link]

— The Team
```

**Email 3: Day 7 (after first reconciliation)**

```
Subject: How's it going?

Hi [First Name],

Congrats on completing your first reconciliation!

We'd love your feedback:
- What did you love?
- What could be better?

Reply to this email — we read every response.

P.S. Ready to upgrade? Professional plan unlocks API access and priority support.
[Upgrade link]

— The Team
```

---

## Revenue Targets

### Soft Launch Revenue Goals

| Plan | Price | Target Signups | Revenue |
|------|-------|----------------|---------|
| Free | $0 | 70 | $0 |
| Starter | $49/mo | 20 | $980/mo |
| Professional | $199/mo | 10 | $1,990/mo |
| **Total** | — | **100** | **$2,970/mo** |

**Annual recurring revenue (ARR) projection:**
- $2,970/mo × 12 = **$35,640 ARR** from soft launch alone

**Conversion rate target:**
- 30% of free users upgrade within 30 days → +21 paid users → +$4,410 MRR

---

## Issue Escalation

### Support Tiers

**Tier 1: Self-Service**
- Knowledge base (docs.banking-recon.com)
- FAQ page
- Video tutorials

**Tier 2: Email Support**
- support@banking-recon.com
- Response time: <4 hours (business hours)
- Handled by: Founders + 1 support agent

**Tier 3: Urgent Issues**
- urgent@banking-recon.com (only for P0: service down, data loss)
- Response time: <1 hour (24/7)
- Handled by: On-call engineer (PagerDuty rotation)

### Known Issues (Document & Workaround)

**Issue tracker (GitHub):**
- [ ] Column mapping fails for OFX files >50MB → Workaround: split file
- [ ] Export occasionally times out for 10k+ transactions → Workaround: export in batches

Document workarounds in Knowledge Base, link in support responses.

---

## Marketing & PR

### Product Hunt Launch (Day 5)

**Submission:**
- Title: "Banking Reconciliation — Automate your month-end close"
- Tagline: "Stop manually matching transactions. 90% time savings."
- First comment (by founder): Brief story + demo video

**Goal:**
- Top 10 Product of the Day
- 100+ upvotes
- 50+ comments
- Traffic spike: 500-1,000 visitors

**Team strategy:**
- All hands upvote at 12:01 AM PST (Product Hunt resets daily)
- Respond to every comment within 1 hour
- Offer promo code: PH50 (50% off first month for PH users)

---

### HackerNews "Show HN" (Day 4)

**Title:** Show HN: I built a tool to automate bank reconciliation

**Post content:**
```
Hi HN,

For the past 6 months I've been building a SaaS platform to automate bank reconciliation (the tedious process of matching bank statements to ledger entries).

Demo: https://app.banking-recon.com
Docs: https://docs.banking-recon.com

Tech stack:
- React + TypeScript
- Node.js + Express
- PostgreSQL (multi-tenant)
- Prometheus + Grafana + ELK for observability
- Stripe for billing

We're in soft launch (100 user cap). Would love feedback from the HN community!

Ask me anything.
```

**Engagement:**
- Respond to all questions within 30 minutes
- Transparent about limitations
- Link to open source components (if any)

---

## Success Criteria (Gate for Step 279)

**Must achieve before proceeding to Step 279 (Monitor Metrics 48h):**

- [ ] ≥50 signups
- [ ] ≥35 users completed ≥1 reconciliation (70% activation)
- [ ] ≥15 paid subscriptions ($735+ MRR)
- [ ] Average convergence rate ≥90%
- [ ] Error rate <1% (24-hour average)
- [ ] API p95 latency <2s (24-hour average)
- [ ] No P0 or P1 bugs open for >4 hours
- [ ] Support response time <4 hours (all tickets)
- [ ] NPS ≥60 (from Day 7 survey)

**If not met:**
- Extend soft launch by 3-7 days
- Diagnose blockers (pricing? UX? bugs? marketing?)
- Fix and retry

---

*Proceed to Step 279 (48-Hour Monitoring) only after all success criteria met.*
