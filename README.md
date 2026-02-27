# Metaverse Club OS

**The command center Second Life club operators have been asking for.**

Running a club in Second Life is more work than it looks. DJs to schedule, hosts to coordinate, tips to track, events to plan — and Discord pinging at 2AM every time someone needs a shift swap. Metaverse Club OS handles all of that so you can focus on actually running your club.

---

## What it does

| Feature | What it means for you |
|---|---|
| 🗓️ **Smart Auto-Roster** | Fills your weekly shift calendar automatically from staff availability — no double-bookings, no manual coordination |
| 💰 **Live Tip Tracking** | See every L$ tip land in real time across your club, DJs, and hosts, as it happens |
| 🟢 **Staff Presence** | Know who is active on the dashboard or online in Discord — updated live, ghost statuses eliminated |
| 🔐 **Role-Based Access** | Owners see everything. DJs and hosts see only their own shifts and tips. Automatic, no configuration needed |
| 📊 **Revenue & Crowd Analytics** | Identify your peak earning hours, top-performing staff, and which event themes draw the biggest crowds |
| 💬 **Discord Integration** | Applications, roster posts, and shift reminders go straight to role-restricted channels in your server |
| 📱 **Mobile-Ready** | Staff confirm shifts, submit availability, and request changes from their phone — no app required |
| 🛡️ **Fraud Protection** | Every packet from Second Life is cryptographically verified. Fake tips and griefing are blocked at the door |
| 📋 **Web-Based Hiring** | Candidates apply on a clean web form — their application lands in a dedicated hiring channel in your Discord |

---

## How it works under the hood

Built with a hybrid database approach:

- **Firestore** — handles all live UI updates (staff status, tip feed, crowd count) with millisecond refresh
- **Google Cloud PostgreSQL** — holds every financial transaction in a strict relational ledger, ACID-compliant, zero data loss even during SL lag spikes
- **LSL Store-and-Forward** — if the region crashes mid-event, the in-world tip jar queues the transaction and retries until the server confirms. 100% tip capture guaranteed

**Presence tracking** monitors dashboard and Discord activity — not Second Life in-world status.

**Discord notifications** post to role-restricted channels in your server, not individual DMs.

---

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=flat-square&logo=firebase)
![PostgreSQL](https://img.shields.io/badge/Google_Cloud-PostgreSQL-blue?style=flat-square&logo=postgresql)
![Discord](https://img.shields.io/badge/Discord-Webhooks-5865F2?style=flat-square&logo=discord)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square&logo=typescript)
![Gemini](https://img.shields.io/badge/Gemini_AI-Optional-purple?style=flat-square&logo=google)

---

## Pricing

| | Setup | Monthly |
|---|---|---|
| **Full Deployment** | ~~$1,000~~ **$700** | $30 / mo |

> **30% launch discount** currently active. [Claim it on the demo site →](https://r-bahuguna.github.io/metaverse-club-os/)

Monthly retainer covers cloud hosting, platform updates, and ongoing support.

---

## Live Demo

[**→ Try the interactive demo**](https://r-bahuguna.github.io/metaverse-club-os/)

Switch between Owner, Manager, DJ, and Host roles to see how the platform adapts. The dashboard, staff view, analytics, and scheduling panels are all fully interactive.

To get this set up for your club, use the contact form on the demo site.

---

*Built for Second Life club operators who are serious about running a tight ship.*
