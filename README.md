# SkillSwap Live (Prototype)

A front-end-only prototype that sketches the SkillSwap Live experience—progressive onboarding, personalized discovery cards, a simulated live room, post-session feedback, plus social layers inspired by TikTok/Instagram (channel follows, clip feed, engagement).

## Getting started

1. Install dependencies: `npm install`
2. Run the dev server: `npm run dev`
3. Open `http://localhost:5173` in your browser.

> **Note:** No backend services are wired. All matchmaking, sessions, and feedback data rely on local mock objects so the flow runs offline.

## Architecture overview

- **Vite + React + TypeScript** keep iteration fast while retaining type safety.
- `src/components/` holds self-contained UI flows (onboarding, discovery, session room, feedback) so they can evolve independently.
- `src/data/mockSessions.ts` seeds demo content. Swap this file for a live API call to connect real sessions.
- `src/services/matchmaking.ts` mimics async host matching/diagnostics; replace with a WebSocket call to your signaling service when ready.

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
