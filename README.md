# MedAssist

Offline emergency guidance and health monitoring for astronauts, built for the
NASA Space Apps Challenge 2026.

MedAssist watches (simulated) wearable and habitat sensors, raises alerts, and walks
a crew member through an emergency step by step, without any link to Earth. Every
event goes into a tamper-evident "black box" that syncs to the base when the link
returns.

> **Demo only, not medical advice.** All protocols, limits and scores are team demo
> values. A flight surgeon must review them before any real use.

## What it does

- **Emergency guidance:** Who needs help? → What is the problem? → a few questions →
  short steps (with timers and "Read aloud"). Texts speak to the person directly when
  they chose **ME**.
- **Triage:** answers + live vitals + mission context (e.g. a recent spacewalk) give
  NOT SERIOUS / SERIOUS / CRITICAL, always shown as colour + icon + word.
- **Monitoring and alerts:** heart rate, blood oxygen, breathing, skin temperature,
  cabin CO2 and radiation. WARNING (amber, silent) and CRITICAL (red, sound); one
  compact banner at a time; alarms can be silenced but stay watched.
- **Black box:** every alert, triage and reading in a SHA-256 hash chain (verifiable),
  export to JSON or CSV, priority sync (critical alerts and radiation dose first).
- **Daily score:** alerts, sleep (from motion) and radiation dose, part by part.

## Getting started

Needs **Node 24** (Nuxt 4.6 supports Node ^22.22.3, ^24.15 or >= 26).

```bash
npm install
npm run dev              # http://localhost:3000
npm run dev -- --host    # also on your phone (same Wi-Fi); use only on a trusted network
```

## Scripts

| Command               | What it does                                                  |
| --------------------- | ------------------------------------------------------------- |
| `npm run dev`         | Development server                                            |
| `npm test`            | All tests (unit + Nuxt), Vitest                               |
| `npm run lint`        | ESLint                                                        |
| `npm run typecheck`   | TypeScript                                                    |
| `npm run format`      | Prettier                                                      |
| `npm run check:lines` | Measures in Chrome that every step fits on 2 lines on a phone |
| `npm run generate`    | Builds the static site into `.output/public`                  |

Before every commit:

```bash
npx prettier --check . && npm run lint && npm run typecheck && npm test
```

## Demo

Open **Demo** in the top menu:

- **Base link:** cut / restore the link to show offline sync.
- **Alert speed:** fast alerts (10 s instead of 30 s) for a live demo.
- **Sleep and dose:** fill short or good nights, add a radiation dose.
- **Mission context:** "a spacewalk just ended", gravity phase.
- **Reset demo data** before each run.

On **Vitals**, choose a scenario: Low oxygen, Fall (on the Moon), Suit problem
(spacewalk), Faint, Cabin CO2, Solar radiation event, Sleeping.

**Offline demo:** `npm run generate`, then `npx serve .output/public`, open it, then
turn Wi-Fi off.

## Deploy (Netlify)

`netlify.toml` holds the settings: build `npm run generate`, publish `dist` (Netlify builds there),
Node 24, single-page-app redirect, security headers, no search indexing.

- **From GitHub:** every push to `main` deploys; every pull request gets a preview link.
- **From the terminal:** `npx netlify-cli deploy` builds with the same settings as Netlify
  (into `dist/`, ignored by Git) and gives a draft link; add `--prod` for the live site.
  Normally you do not need this: merging into `main` deploys by itself.

## Editing protocols

Protocols live in `app/data/protocols/*.json` and load automatically; add the problem
to `app/data/problems.json`. The tests enforce the content rules:

- every step starts with a verb, has 15 words max and 47 characters max
  (then run `npm run check:lines` with `npm run dev` running);
- no medical jargon (CPR, airway, decompression, ...): plain words for an outsider;
- every "they / them" text has a `textSelf` / `labelSelf` "you" version;
- CRITICAL steps include "ALERT BASE";
- `hazardId` (NASA risk) and `source` are filled in.

Vital and habitat limits live in `app/utils/vitalLimits.ts` and
`app/utils/envLimits.ts`, each with its source.

## Project structure

```
app/
  pages/            home, vitals, blackbox, demo, emergency/ (index = who, problem,
                    severity = questions, guidance = steps)
  components/       ui/ (banner, status bar, buttons), emergency/, vitals/
  composables/      useAlerts, useVitals, useEnvironment, useBlackBox, useSync,
                    useTriage, useProtocols, useMission, useSleep, useSpeech
  utils/            triageEngine, vitalLimits, envLimits, personalize, sleep,
                    healthScore, blackboxExport, sha256, vitalsSimulator
  data/             problems.json, protocols/*.json
test/
  unit/             plain Vitest (no Nuxt)
  nuxt/             Nuxt environment (pages, composables)
scripts/            check-step-lines.mjs
docs/               SDLC package, gap analysis, 24-hour guide (PDF)
```

## Project documents

| Document                                                                                  | What it contains                                                                                                                                         |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [MedAssist SDLC Package](docs/MedAssist-SDLC-Package.pdf)                                 | Problem analysis, software and system requirements (with IDs such as FR-TRI-01), architecture and the Scrum plan. The product is called AstroMind there. |
| [Hazard and Threshold Gap Analysis](docs/MedAssist-Hazard-and-Threshold-Gap-Analysis.pdf) | The MVP compared with NASA and CSA human-health sources: 20 gaps (B-1 … D-6) and the actions taken.                                                      |
| [24-Hour MVP Implementation Guide](docs/MedAssist-24-Hour-MVP-Implementation-Guide.pdf)   | The step-by-step build plan for the hackathon: 6 mini-sprints, tracks A to D, every file to create.                                                      |

The IDs used in this README and in code comments (for example "SDLC 4.10", "FR-BBX-03",
"gap analysis C-3") point into the first two documents.

The code started from the 24-hour guide and has since moved on in a few places: the
stylesheet is `app/assets/css/main.css`, tests live in `test/unit` and `test/nuxt`, the
emergency flow asks "Who needs help?" first, alerts have WARNING and CRITICAL levels, and
the gap-analysis features were added on top.

## Why this simplified version

The full product is described in the team's
[**MedAssist SDLC Package**](docs/MedAssist-SDLC-Package.pdf) (problem analysis,
requirements, system design and a 14-week Scrum plan; the product is called AstroMind
there). What you see here is the **hackathon MVP**: built in about 24 hours, it proves the
riskiest idea first, a non-expert reaching the first instruction in under 60 seconds,
fully offline (SDLC section 1.9, Gate 1).

We simplified on purpose:

- **Time:** 24 hours instead of 7 two-week sprints. We built the emergency flow first,
  as the SDLC plan says ("the riskiest part is built and tested first").
- **No hardware:** sensors, the crew mesh and the base are simulated in the browser
  (SDLC 3.3: "In the MVP all sensors are simulated").
- **One place to run:** everything runs in the browser (`ssr: false`), so the same build
  works on a laptop, a phone, Netlify, or offline with `npx serve`. The triage engine is a
  plain TypeScript function, as SDLC 4.8 requires, so it never needs a server.
- **Honest security:** a hash chain detects any change to the black box (SDLC FR-BBX-03).
  We did **not** add encryption: without a hardware key store (SDLC SYS-HW-09) the key
  would sit next to the data, which only looks secure.
- **Explainable rules, not AI:** fixed limits plus a simple personal baseline, as SDLC 4.10
  describes for the MVP "local AI". Medical experts can read and check every rule.
- **Demo content:** protocols, limits and scores are placeholders until flight surgeons
  write and approve them (SDLC 1.7).

We also learned from testing and changed the plan where it helped the user:

- **Who needs help? comes first**, then the problem (the SDLC order is problem, then
  person). Team testing showed it is the more natural first question, and it lets the
  texts speak to the person directly ("Sit upright") when they chose ME.
- **Space-specific content** from our NASA/CSA
  [gap analysis](docs/MedAssist-Hazard-and-Threshold-Gap-Analysis.pdf): pain after a spacewalk,
  dizziness after a gravity change, cabin CO2 and radiation, mission context.

## What we really intend to build (next steps)

Where the MVP stands against the SDLC package, and what comes next:

| Area             | Today (hackathon MVP)                                   | Planned (SDLC package)                                                                          |
| ---------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Problems         | 7 protocols                                             | 12 problems + "I don't know" with a general life-support protocol (FR-TRI-02, 03)               |
| Teammate         | ME / MY TEAMMATE                                        | Choose the teammate from the crew list, attach their latest vitals (FR-TRI-05)                  |
| Storage          | `localStorage`, about 10 days, failures shown on screen | IndexedDB, then SQLite on the device, 30 days with power-loss safety (SYS-SW-04, NFR-08)        |
| Security         | SHA-256 hash chain, verified on screen                  | + AES-256-GCM encryption at rest, keys in a secure element, signed exports (FR-BBX-04, 07)      |
| Black box viewer | Latest records, JSON and CSV export                     | Filter a time window around an event in under 5 s (FR-BBX-06)                                   |
| Baseline         | Median of the last 5 minutes of safe readings           | Mean and standard deviation over 7 days, z-score alerts (FR-MON-06)                             |
| Fall / impact    | Alert after an impact and stillness, by gravity phase   | Plus an "Are you OK?" 30 s countdown before alerting the team (FR-MON-05)                       |
| History          | Live tiles and the daily score                          | 30-day chart per vital (FR-MON-08)                                                              |
| Sync             | Simulated: priority order, batches of 200               | Real base link: acknowledged batches, retries with growing waits, no duplicates (FR-SYN-01..04) |
| Local services   | None: all in the browser                                | `server/api` services on the device (SYS-SW-03)                                                 |
| Settings         | Demo page only                                          | Profile, teammates, volume, text size (FR-CNT-03)                                               |
| Protocol footer  | Version                                                 | Version and approval date (FR-CNT-02)                                                           |
| Team process     | `main` + feature branches + pull requests               | `develop` branch, CI on every pull request, a tag per sprint (SDLC 5.3)                         |

**Next steps, in order:**

1. **Timed usability test** with 5 people outside the team, on a phone with gloves
   (SDLC Sprint 3, Gate 1): 9 of 10 runs reach the first instruction in under 60 s.
2. **Medical review** of every protocol, limit and score by flight surgeons (SDLC 5.12).
3. **IndexedDB storage and encryption** for the real 30-day black box (SDLC Sprint 5,
   Gate 2).
4. **Real sync** with acknowledgements and retries (SDLC Sprint 6, Gate 3).
5. **CI** on GitHub (lint, typecheck, tests, build on every pull request) and release tags.
6. **The remaining problems**, teammate vitals, 7-day baseline, history charts, settings.
7. **Hardware** after the MVP: real sensors, the crew mesh, a hardware SOS button and the
   radiation instrument data (SDLC 3.2, 5.12).

Other limits today: the radiation dose is counted since the app started, not per day or
career.

## Working on the repo

Branch from `main`, open a pull request, and write commit messages like
`feat: ...`, `fix: ...`, `polish: ...` (a title, a blank line, then details). For long
messages, write them in a file and use `git commit -F file.txt`.
