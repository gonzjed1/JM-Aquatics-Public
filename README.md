# JM-Aquatics-Public
JM Aquatics Public file

> **Website banner:** this repo also holds `announcement.json`, which the J&M Aquatics website reads for its banner. That file must stay at the repository root — don't move it into a folder or rename it.

## J&M Scheduling — employee time clock

The J&M Aquatics employee app: swim instructors clock in and out, see their schedule, answer ✓ / ✗ to open shifts, and check their hours and estimated pay. Admins run the schedule, watch the live time clock, and approve requests; the owner also handles payroll. It replaces texting Jed your hours.

One [Expo](https://expo.dev) / React Native codebase ships three targets: **iOS**, **Android**, and **web**. Web is the first deliverable.

**Current build:** demo login with three personas — Worker, Mike (Admin), and Jed (Owner). Real per-person accounts and roles arrive with Azure sign-in in Phase 4. Every screen is built and runs on mock data (a frozen demo day, Thu Aug 7 2025); the backend — the existing Azure-hosted Postgres API — comes with that same phase. Until then the login screen is a demo gate, not security.

## Roles

Three tiers, enforced in `constants/permissions.ts` and again at the route level.

| Tier | Who | Can |
|---|---|---|
| **Owner** | Jed | Full access, including pay amounts, the weekly payroll total, payroll export, pay rule settings, and role assignment |
| **Admin** | Mike. Ulises: TBD until Jed confirms | Scheduling, approvals, and availability / correction / overtime alerts. Pay amounts and the payroll total are hidden by default |
| **Worker** | Everyone else | Own hours, own pay, own shifts only |

Ben has admin access in the demo build for development and testing only.

Rule of thumb: **pay data for anyone other than yourself is Owner-only.**

### What each tab shows

| Tab | Worker | Admin / Owner |
|---|---|---|
| **Home** | Today's shift with Clock In / Out, open shifts to answer, upcoming shifts | Today's overview, recent activity feed |
| **Schedule** | Upcoming list, month calendar | Week / Day / Staff views, **+ Add Shift**, per-shift ✓ / ✗ / pending with Assign |
| **Time** | Big punch button, today's punches | Who's on the clock now, employee lookup, all punches |
| **Messages** | Layout preview only — real messaging is a later phase | same |
| **More** | Profile, Availability, My Hours, My Pay, Settings, Help | Staff Management, Reports, Approval Queue, Settings, Help — plus **Payroll**, pay figures in Reports, and pay rules in Settings for the Owner only |

## Pay data — for Jed

Per-employee pay rates are entered once by Jed in pay settings (Owner only, Phase 4).

For historical hours and pay from the current system, either:

- export the existing records to a spreadsheet or CSV — one row per employee per pay period: **name, period, hours, rate, gross pay** — and send it to Ben for import, or
- contact Ben directly if real-time entry is preferred, or if the import needs to match the current format.

## Run it

Requires Node 20 or newer and npm. Expo SDK 54 — don't upgrade it.

```bash
git clone https://github.com/gonzjed1/JM-Aquatics-Public.git
cd JM-Aquatics-Public
npm install
npx expo start
```

From the Expo menu press `w` for web, `a` for Android, `i` for iOS, or go straight to the browser:

```bash
npx expo start --web
```

On the login screen choose **Sign in as Employee** (no passcode), or enter the demo passcode and pick **Jed (Owner)** or **Mike (Admin)**. All personas share one in-memory data store, so signing out as Jed and back in as the worker shows the effects of what Jed just did — handy for demos.

Before calling a change done:

```bash
npx tsc --noEmit
npx expo lint
npx expo export --platform web
```

## Where things live

```
app/                    Screens — Expo Router, file-based
  _layout.tsx           Auth gate: login until a role is chosen, then the tabs
  login.tsx             Sign-in screen (video background, animated water fallback)
  (tabs)/               Home | Schedule | Time | Messages | More
    index.tsx …         Each tab picks its admin or worker variant by role
    more/               Nested stack: pay, hours, profile, availability,
                        payroll, breakdown, staff, reports, approvals, activity,
                        settings, help — owner/admin routes are guarded here too
components/             Shared UI
  home/ schedule/ time/ The admin and worker variants of each tab
  ui/                   Card, ListRow, Segmented, StatTile, Button, …
  water-background.tsx  Animated pool water (login fallback)
contexts/
  auth-context.tsx      Role state and the temporary demo gate → Entra ID later
  app-data.tsx          The store: shifts, punches, requests, responses,
                        notifications, and the actions the buttons call
data/
  mock-seed.ts          The whole company on one demo day — swap for the API
  format.ts shifts.ts   Dates, times, money, shift helpers
  payroll.ts            Pay math and CSV export (estimates until rules are confirmed)
constants/
  permissions.ts        Who can do what — `can(role, capability)`
assets/                 Icons, splash, the login video
design-refs/            Design reference screens and the logo (source videos are git-ignored)
docs/                   Statement of work and phase addendum
AGENTS.md               Working agreement for anyone (or any AI) editing this code
```

Mock data convention: shared, cross-screen state goes through the store in `contexts/app-data.tsx`; a screen whose data is purely its own keeps a clearly fenced mock block at the top of its file. Either way the render code doesn't change when real data arrives.

## Learn more

- [Expo documentation](https://docs.expo.dev/) — SDK 54 docs at `docs.expo.dev/versions/v54.0.0/`
- [Expo Router](https://docs.expo.dev/router/introduction) — the file-based routing used in `app/`
