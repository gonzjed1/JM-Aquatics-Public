# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# J&M Scheduling / Time Clock App

## What this is
Employee scheduling + time clock app for J&M Aquatics (swim instruction company, ~12 employees), built by Ben (Sphinx) for the client Jed. Replaces the current system of employees texting Jed their hours. One Expo codebase ships three targets: iOS, Android, and **web** (web is the current priority deliverable — Jed wants the website live ASAP).

This is a REAL product the business will actually use — not a mockup project. Screens currently run on mock data, but every screen must be built so mock data swaps for real API data without redesign.

## People and roles
Three tiers. The tier is the `Role` in `contexts/auth-context.tsx`; what each tier may do is `GRANTS` in `constants/permissions.ts`. Screens ask `can(role, capability)` — never compare role names in a screen.

- **Owner — Jed.** Full access, including pay amounts, the weekly payroll total, payroll export, pay rule settings, and role assignment.
- **Admin — Mike.** Scheduling, approvals, and availability / correction / overtime alerts. Pay amounts and the payroll total are hidden by default. **Ulises** — TBD until Jed confirms (do not build anything specific to him).
- **Worker** (swim instructors) — own hours, own pay, own shifts only. Sees who's working which days (names/times only — never other people's pay), clocks in/out, answers ✓ / ✗ to open shifts.

Ben has admin access in the demo build for development and testing only.

Golden rule: **pay data for anyone other than yourself is Owner-only.** Never render another employee's pay in a worker or admin view.

Current build: demo login with three seeded accounts — owner (Jed), admin (Mike), employee (Sam Ortiz in the seed); see *Login screen* below. Real per-person accounts and roles arrive with Azure sign-in (client-facing "Phase 4" = roadmap steps 4–5 below).

## Tech stack — DO NOT DEVIATE
- Expo SDK **54** (React Native + expo-router tabs). Do NOT upgrade the SDK. Do NOT run `npm audit fix --force`. Do not modify package.json/package-lock.json unless the task explicitly requires a new package.
- Web via react-native-web. **Every change must work on web** (`npx expo start --web`) — that's the near-term deliverable. Verify web before calling a task done.
- Styling: plain React Native `StyleSheet` with the existing shared components (`ThemedText`, `ThemedView`, `IconSymbol`, `ParallaxScrollView`). NO Tailwind, no web-only CSS.
- On web, main content is capped at ~600px wide and centered; keep that pattern on new screens.
- Backend (future): existing Azure-hosted Postgres API behind Cloudflare; auth will be Microsoft Entra ID via MSAL. Not wired yet.
- Windows ARM dev machine; repo at C:\JMDev\JM-timeclock-Android-Apple.
- `design-refs/*.mp4` is git-ignored on purpose: the raw source video is 283 MB and GitHub rejects files over 100 MB. The 3.8 MB cut the app plays lives at `assets/videos/pool-swimmers.mp4`.

## Current state
Login gate (`app/login.tsx`; demo accounts in `contexts/auth-context.tsx`) in front of five role-switched tabs matching `design-refs/all-screens.png`: **Home** | **Schedule** | **Time** | **Messages** | **More**. Each tab file in `app/(tabs)/` picks its variant by capability from `components/home|schedule|time/` — Owner and Admin share the admin variants, Workers get their own. **More** is a nested Stack (`app/(tabs)/more/`) so detail screens push over the menu with the tab bar visible: `pay`, `hours`, `profile`, `availability` (worker), `staff`, `reports`, `approvals`, `activity` (admin + owner), `payroll`, `breakdown` (owner), `settings`, `help` (all). `app/(tabs)/timesheet.tsx` is a step-1 leftover kept off the bar with `href: null` (My Hours replaced it); every other file in `app/(tabs)/` is a real tab. Messages is the layout shell only: a large **New Message** button in the header and a people search at the top (filters as you type, call + message per result, tapping opens that DM via `openDm`); threads open and read, sending waits for the messaging service. All mock data.

Permissions: `constants/permissions.ts`. Owner-only capabilities are `viewPayroll` (anyone else's pay amounts, the payroll total, CSV export, the Payroll screen and Reports' labor-cost card), `editPayRules` (Settings → Pay rules) and `assignRoles` (Staff Management role toggle). Admin holds `manageSchedule`, `approveRequests`, `viewAllHours`, `manageStaff`. Worker holds `viewOwnPay`. Routes are guarded in `more/_layout.tsx` *and* hidden from the menu — hiding a row is not a gate.

Arm-then-confirm (`hooks/use-armed-action.ts`) covers every punch and the Submit Availability button — the Home card button, the Time tab's big button, and More → Availability: the first tap arms ("Tap again to clock in/out", visibly different), a second tap within ~4 s fires the punch, otherwise it disarms itself. No modal. New punches are stamped so they always sort after the person's existing same-day punches (`nextPunchTime` in the store) — live time-of-day on the frozen demo day would otherwise file a morning punch before the seeded 12:01 clock-out.

Locations are free text, not a closed set: `LOCATIONS` in the seed is only the starting list (LA Fitness Bowie, SPRFC Severna Park) and the store's `locations` selector is every location in use, A–Z. One `ShiftForm` (`components/schedule/shift-form.tsx`) posts *and* edits a shift — Schedule's **+ Add Shift**, and **Edit shift** inside an expanded upcoming row (`updateShift`; slots can never drop below the people already assigned) — and its `LocationField` is a chip per known location plus **+ New location** for free text. A location lives on the shift, so it flows to the calendar, the availability board, the posting notification and every other place a shift is shown, and joins the picker and Settings → Locations from then on.

Open shifts: Workers answer ✓ / ✗ per open shift (Home "Open shifts" card and More → Availability; `respondToShift`); shifts that clash with their own are filtered out (`data/shifts.ts`). Owner and Admin see every upcoming shift's responses in Schedule — Week rows expand, Day view shows them inline — ordered ✓, then ✗, then pending, with an **Assign** button on ✓ names while there's room (`assignToShift`). Posting a shift notifies every worker (Home tab badge + "New" pill; `notifications` in the store). The line on their Home reads **"New shift posted — tap ✓ or ✗ to give your availability"** with the shift under it, and tapping it opens the availability board (More → Availability) where the ✓ / ✗ buttons are. A shift-filled line is news, not an action, so it does not link anywhere. Push notifications are roadmap step 6.

Awaiting approval: a worker's ✓ on a shift that still has room *is* the pending offer — nothing extra is stored. It shows in the worker's Upcoming Shifts (Home, above the Open shifts card, and Schedule → Upcoming) tagged **Awaiting approval**, in date order with confirmed shifts (`awaitingFor`); ✗ and unanswered shifts don't appear there. The same offers appear in More → Approval Queue under **Shift offers** (`pendingOffers`, counted in the badge and the Pending Requests tile) with an **Assign** button — the same `assignToShift` as Schedule — which turns the row into a confirmed shift. When an assignment fills the last slot, everyone else who offered gets a `shift-filled` notification (their Home "Activity" card) and the offer drops off both sides.

Admin Home (owner + admin), top to bottom: a red **unfilled-shift banner** whenever a shift in the next 48 hours (today or tomorrow on the demo day) still has open slots — names the soonest one, tapping opens `more/open-shifts?shift=<id>` with that shift on top; Today's Overview tiles — **Staff Today** opens `more/staff-today` (roster grouped Available / Not available / Pending by their answers to open shifts, phone on the right, call + message per row), **Open Shifts / Staff Needed** (one line in the box) counts the people still needed for the *soonest* open shift — not how many shifts are open, which says nothing about urgency — and opens `more/open-shifts` (the availability board), **Pending Requests** opens the Approval Queue; **Today's shifts** (time · location, fill count, who's on it with call + message, red "N slots unfilled" pill); **Availability** (every open upcoming shift with responders grouped Available / Not available / No response, call + message on each name, Assign on the available ones); then **Recent Activity**.

Contact actions: wherever an employee appears on an owner/admin screen — activity rows, availability responses, staff lists, the Day view roster, the time-clock live list and lookup, the Approval Queue, the payroll detail — the name carries **call** and **message** buttons (`components/ui/contact-buttons.tsx`). Call opens `tel:` and message opens `sms:` with the number — both hand off to the phone for now, and the component says so. **Phase 3** (in-app messaging) switches the message button to opening that person's DM inside the app; the Messages tab's own search results already open threads in-app through `openDm`. Nothing sent from the phone's messaging app can be read back into this one — iOS gives no app access to SMS — so the `sms:` hand-off is a stopgap, not the destination. Every seeded person has a 555 number. A shift is always referenced with its time next to its location — `shiftTimePlace()` ("9:00 AM – 12:00 PM · LA Fitness Bowie") or the dated `shiftLabel()`.

Home → More navigation: Home pushes More screens directly (tiles, banner, gear, View All Activity, "See all") with `params: { from: 'home' }`; those screens call `useBack()` (`hooks/use-back.ts`), which returns to Home instead of popping. The Home tab's `state` listener in `app/(tabs)/_layout.tsx` drops More's nested stack whenever another tab is focused and the stack isn't a bare menu — on web a cross-tab push lands at the bottom of More's stack and browser-history back doesn't unwind it, so without this the next push stacks on a stale screen and a menu tap into the same screen reuses its old params.

Notification preferences: **More → Notifications** (`more/notifications.tsx`, every role, no capability gate — it's your own account) is one switch per topic, **Shifts / Messages / Updates**, all on by default. They live in the store as `notificationPrefs` keyed by staff id (`prefsFor`, `setNotificationPref`; absent means all on), so one person's switches never touch another's. Muting Shifts empties `notificationsFor`, which clears the Home badge and the postings card with it. Settings links here rather than keeping a second set of toggles. In Phase 4 the same switches decide what gets pushed to the phone.

Mock data convention (keep it): shared, cross-screen state lives in the store — `data/mock-seed.ts` is the fenced seed (the whole company on one frozen demo day, Thu Aug 7 2025) and `contexts/app-data.tsx` wraps it with the actions buttons call (`clockIn`, `addShift`, `setRequestStatus`, `submitAvailability`, `addStaff`, `respondToShift`, `assignToShift`, `setStaffRole`). Replace the action bodies with API calls; screens keep calling the same functions. Screens whose data is purely their own (My Pay, My Hours) keep a fenced block + calculation function at the top of the file. Rate must be consistent across all screens ($24.50/hr in mock data); pay math for owner payroll lives in `data/payroll.ts`.

## Design direction
Match the reference images in `design-refs/`:
- `design-refs/all-screens.png` — the master reference: every target screen for admin view and employee view (Home dashboard, Schedule, Time Clock, Messages, More, Payroll/My Pay), bottom tab bar Home | Schedule | Time | Messages | More.
- `design-refs/logo.webp` — official J&M Aquatics logo (circular, blue).
Clean, card-based, white background, navy/blue text, green accent for primary actions. When building or restyling a screen, match the corresponding panel in all-screens.png for layout and content, but always implement with our existing components and styling system.

Login screen background: the `assets/videos/pool-swimmers.mp4` swimmers video (overhead drone shot of a lap pool, cut to a seamless 12s loop) plays full-screen via expo-video — cover fit, centred crop, looping, muted, autoplaying. The animated `WaterBackground` component is the fallback: it shows until the video starts and stays up if autoplay is blocked. Keep the scrim over the video at 10% or lighter so the water stays bright, and keep the sign-in card frosted glass (semi-transparent white over a blur).

## Login screen (pre-app gate)
A login screen shown before the tabs:
- Background: the swimmers video with the animated water fallback (see Design direction). J&M logo prominent.
- One frosted card with two buttons, **Employee** and **Admin**, and no descriptive text under them. Tapping either animates in Email + Password fields and a **Sign In** button beneath the buttons — no navigation to another screen.
- **The role comes from the account, never from the button.** Someone who taps the "wrong" button still signs in and gets their correct screens.
- The Admin path adds one step after a successful sign-in: the admin PIN (`TEMP_ADMIN_PIN`) — an "Admin PIN" label, numeric input, **Continue** and **Back**. The Employee path doesn't ask for it. Both panels share one `Animated.Value`; the reveal is started from an effect keyed on the panel that is mounted, never from the tap handler (unmounting the previous panel detaches the value and stops a running animation — that left the PIN step blank).
- Three demo accounts — owner, admin, employee — are seeded in `contexts/auth-context.tsx` with `TEMP_DEMO_PASSWORD` as the password. **Never print the demo emails on screen or in the README.**
- Errors: wrong credentials → "Email or password is incorrect."; wrong PIN → "That PIN is not right."
- TEMPORARY auth — DEMO GATE ONLY, not security. Auth state is `{ role, userId }`; screens read it through `useAuth()` and `useMe()`. MSAL/Entra ID replaces `signIn` and the seeded accounts; nothing else changes.

## Roadmap order (don't jump ahead without being asked)
1. Polish current 3 screens (consistent mock numbers, width cap on web, rename explore→timesheet) — done
2. Login screen + role context (demo gate) — done
3. Role-gated screens per all-screens.png: employee Home dashboard, admin Home dashboard, Schedule views, More tab — done
4. Real backend: Postgres tables + endpoints (punch, timesheet, pay summary), typed API client replacing mock blocks
5. MSAL/Entra ID auth replacing the demo gate (per-person accounts and roles; pay rates entered once by the Owner in pay settings)
6. Offline punch queue, punch corrections, break tracking, push notifications, store submission
Messaging tab: build the UI shell only if asked; real messaging is a later phase (managed service, likely Stream).

## Working rules
- One scoped task per session/prompt. Read the relevant existing files before writing new code.
- Never build an owner- or admin-only feature without putting it behind the capability gate.
- Never claim done without verifying: `npx tsc --noEmit`, `npx expo lint`, and check the web build.
- Pay calculation rules (overtime, rounding, break deduction, pay periods) are NOT confirmed by the client yet — keep all pay math in one swappable function per screen and treat outputs as estimates.
