# SkillSwap Live (Prototype)

A front-end-only prototype that sketches the SkillSwap Live experience—progressive onboarding, personalized discovery cards, a simulated live room, post-session feedback, plus social layers inspired by TikTok/Instagram (channel follows, clip feed, engagement).

## Getting started

1. Install dependencies: `npm install`
2. Run the dev server: `npm run dev`
3. Open `http://localhost:5173` in your browser.

> **Note:** No backend services are wired. All matchmaking, sessions, and feedback data rely on local mock objects so the flow runs offline.

## Development scripts

- `npm run lint` – ESLint 9 + TypeScript rules keep components, hooks, and tests aligned with the repo guidelines.
- `npm test` – Jest + React Testing Library regression coverage for onboarding, clip feed, app shell, and filtering helpers.
- `npm run build` – Type-checks (via `tsc -b`) and emits the production bundle under `dist/`.
- `npm run preview` – Serves the built assets locally so you can verify the exact bundle Vercel will publish.

## Deployment (Vercel free tier)

1. Commit and push your changes to GitHub.
2. In Vercel, click **New Project → Import Git Repository** and select `dhawal-ss/skillswap-live`.
3. Accept the detected Vite build settings (`npm run build`, output `dist`) and run the initial deploy.
4. Add any required environment variables under Project Settings → Environment Variables, then redeploy.
5. Visit the generated `*.vercel.app` URL to smoke-test onboarding, clip playback, saved mode, and analytics logging.
6. Every push to `main` triggers a new production deploy; feature branches automatically get preview URLs for review.

## Architecture overview

- **Vite + React + TypeScript** keep iteration fast while retaining type safety.
- `src/components/` holds self-contained UI flows (onboarding, discovery, session room, feedback) so they can evolve independently.
- `src/data/mockSessions.ts` seeds demo content. Swap this file for a live API call to connect real sessions.
- `src/services/matchmaking.ts` mimics async host matching/diagnostics; replace with a WebSocket call to your signaling service when ready.
- `src/components/Logo.tsx` centralizes the SkillSwap wordmark + arrow motif so nav, onboarding, and any future surfaces stay in sync without shipping bitmap assets.

## Key flows

1. **Onboarding** – Collects preferred skills, teaching comfort, and availability while detecting the user’s timezone.
2. **Discovery board** – Filters live/soon/later sessions, surfaces featured skill clips, lets users search, and shows a toast while matching.
3. **Clip feed** – Vertical scroll of short-form skill teasers with likes/comments/saves, channel info, and CTAs to jump into the related live session.
4. **Channel hub** – Grid of creator profiles with follow toggles, specialties, and follower counts to mirror social app patterns.
5. **My profile** – Click your name in the nav to edit your bio/tags and publish personal clips/sessions with live engagement counters.
6. **Session room** – Simulates WebRTC controls (mute, camera, captions, emoji reactions) plus collaborative notes.
7. **Feedback sheet** – Captures ratings, qualitative tags, and notes, echoing the summary above the discovery feed.

## Next steps ideas

- Replace mock avatars and data with backend-driven content.
- Swap `src/services/api.ts` mock implementations with real HTTPS/WebSocket endpoints so the UI fetches live sessions, clips, and comments.
- Wire the session room to an SFU (LiveKit, Daily, etc.) and swap the placeholder video panel with real media streams.
- Persist onboarding + feedback data to a database and feed it into a real recommendation service.
- Layer in authentication (NextAuth, Clerk, etc.) to support multi-device sessions and host dashboards.
- Replace the dummy `reactToClip` / `followCreator` calls with actual mutations and stream updates back over a subscription channel so likes/follows stay in sync across devices.
- Store creator-authored sessions/clips (and profile edits) in a backend or browser storage; they currently live only in memory for demo purposes.
