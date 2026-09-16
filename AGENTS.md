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

Current build: demo login with three personas — Worker (Sam Ortiz in the seed), Mike (Admin), Jed (Owner). Real per-person accounts and roles arrive with Azure sign-in (client-facing "Phase 4" = roadmap steps 4–5 below).

## Tech stack — DO NOT DEVIATE
- Expo SDK **54** (React Native + expo-router tabs). Do NOT upgrade the SDK. Do NOT run `npm audit fix --force`. Do not modify package.json/package-lock.json unless the task explicitly requires a new package.
- Web via react-native-web. **Every change must work on web** (`npx expo start --web`) — that's the near-term deliverable. Verify web before calling a task done.
- Styling: plain React Native `StyleSheet` with the existing shared components (`ThemedText`, `ThemedView`, `IconSymbol`, `ParallaxScrollView`). NO Tailwind, no web-only CSS.
- On web, main content is capped at ~600px wide and centered; keep that pattern on new screens.
- Backend (future): existing Azure-hosted Postgres API behind Cloudflare; auth will be Microsoft Entra ID via MSAL. Not wired yet.
- Windows ARM dev machine; repo at C:\JMDev\JM-timeclock-Android-Apple.
- `design-refs/*.mp4` is git-ignored on purpose: the raw source video is 283 MB and GitHub rejects files over 100 MB. The 3.8 MB cut the app plays lives at `assets/videos/pool-swimmers.mp4`.

## Current state
Login gate (`app/login.tsx`, demo passcode in `contexts/auth-context.tsx`) with three personas in front of five role-switched tabs matching `design-refs/all-screens.png`: **Home** | **Schedule** | **Time** | **Messages** | **More**. Each tab file in `app/(tabs)/` picks its variant by capability from `components/home|schedule|time/` — Owner and Admin share the admin variants, Workers get their own. **More** is a nested Stack (`app/(tabs)/more/`) so detail screens push over the menu with the tab bar visible: `pay`, `hours`, `profile`, `availability` (worker), `staff`, `reports`, `approvals`, `activity` (admin + owner), `payroll`, `breakdown` (owner), `settings`, `help` (all). Messages is the layout shell only. All mock data.

Permissions: `constants/permissions.ts`. Owner-only capabilities are `viewPayroll` (anyone else's pay amounts, the payroll total, CSV export, the Payroll screen and Reports' labor-cost card), `editPayRules` (Settings → Pay rules) and `assignRoles` (Staff Management role toggle). Admin holds `manageSchedule`, `approveRequests`, `viewAllHours`, `manageStaff`. Worker holds `viewOwnPay`. Routes are guarded in `more/_layout.tsx` *and* hidden from the menu — hiding a row is not a gate.

Open shifts: locations are **LA Fitness Bowie** and **SPRFC Severna Park** only (`LOCATIONS` in the seed). Workers answer ✓ / ✗ per open shift (Home "Open shifts" card and More → Availability; `respondToShift`); shifts that clash with their own are filtered out (`data/shifts.ts`). Owner and Admin see every upcoming shift's responses in Schedule — Week rows expand, Day view shows them inline — ordered ✓, then ✗, then pending, with an **Assign** button on ✓ names while there's room (`assignToShift`). Posting a shift creates an in-app notification for all workers (Home tab badge + "New" pill; `notifications` in the store). Push notifications are roadmap step 6.

Mock data convention (keep it): shared, cross-screen state lives in the store — `data/mock-seed.ts` is the fenced seed (the whole company on one frozen demo day, Thu Aug 7 2025) and `contexts/app-data.tsx` wraps it with the actions buttons call (`clockIn`, `addShift`, `setRequestStatus`, `submitAvailability`, `addStaff`, `respondToShift`, `assignToShift`, `setStaffRole`). Replace the action bodies with API calls; screens keep calling the same functions. Screens whose data is purely their own (My Pay, My Hours) keep a fenced block + calculation function at the top of the file. Rate must be consistent across all screens ($24.50/hr in mock data); pay math for owner payroll lives in `data/payroll.ts`.

## Design direction
Match the reference images in `design-refs/`:
- `design-refs/all-screens.png` — the master reference: every target screen for admin view and employee view (Home dashboard, Schedule, Time Clock, Messages, More, Payroll/My Pay), bottom tab bar Home | Schedule | Time | Messages | More.
- `design-refs/logo.webp` — official J&M Aquatics logo (circular, blue).
Clean, card-based, white background, navy/blue text, green accent for primary actions. When building or restyling a screen, match the corresponding panel in all-screens.png for layout and content, but always implement with our existing components and styling system.

Login screen background: the `assets/videos/pool-swimmers.mp4` swimmers video (overhead drone shot of a lap pool, cut to a seamless 12s loop) plays full-screen via expo-video — cover fit, centred crop, looping, muted, autoplaying. The animated `WaterBackground` component is the fallback: it shows until the video starts and stays up if autoplay is blocked. Keep the scrim over the video at 10% or lighter so the water stays bright, and keep the sign-in cards frosted glass (semi-transparent white over a blur).

## Login screen (pre-app gate)
A login screen shown before the tabs:
- Background: the swimmers video with the animated water fallback (see Design direction).
- J&M logo prominent.
- Clearly visible sign-in boxes: **Employee** (no passcode) and a passcode-gated card offering **Jed (Owner)** and **Mike (Admin)**.
- TEMPORARY auth: the passcode is one obvious constant (`TEMP_ADMIN_PASSCODE`). This is a DEMO GATE ONLY, not security — it must be trivially replaceable by MSAL/Entra ID later. Auth state is `role: 'owner' | 'admin' | 'worker' | null`; real auth slots into the same interface by changing what sets `role`.
- The role chosen at login drives which tabs/screens render (see permissions above).

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
