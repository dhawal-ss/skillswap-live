# SkillSwap Live – Recent Updates

## Clip Experience
- **Tap-to-play reels:** Each card now contains the real video, centered play control, loading spinner, and a scrub-style progress bar. Tapping anywhere on the media toggles play/pause, while an inline mute pill controls audio across all reels.
- **Blob-aware uploads:** Both the discovery composer and profile composer accept MP4/WEBM files up to 25 MB, generate blob URLs for preview, and route them through `clipService.uploadDraft`. This eliminates placeholder usage and makes saved clips feel real.
- **Autopause & analytics:** Reels pause automatically when off screen (IntersectionObserver) and emit analytics events (`clip.play`, `clip.pause`, `clip.completed`) so we can analyze engagement. View counts are surfaced directly on the card.

## Discovery & Tour
- **Creators to follow rail:** The Sessions page now shows a card grid mixing preview art, creator stats, and a “Watch clip” button that jumps into the Clips tab with the reel auto-playing and scrolled into view.
- **Tour update:** Added a “Discover creators” stop in the guided tour that highlights the new rail. This replaces the defunct personalization sidebar and keeps first-time users oriented.
- **Standardized topic labels:** Added `skillTagLabels`/`orderedSkillTags`, so nav pills, onboarding chips, and tag chips all render polished labels like “Art/Design”, “Business/Finance”, “Martial Arts”.

## Profile & Saved Insights
- **Insight cards:** The profile page now shows “Saved clips”, “Avg saves per clip”, and “Most saved clip” metrics plus a mini gallery of top pinned reels for quick reference.
- **Saved-mode navigation:** The user dropdown’s “Saved clips” option switches the Clips tab into a saved-only view, scrolls to the relevant reel, and starts playback automatically. Saved state syncs to localStorage per user.
- **Analytics for saves:** Pin/unpin actions fire `clip.saved`/`clip.unsaved` events and are persisted through the new clip service helper, paving the way for dashboards or backend sync.

## Services & Testing
- **Service layer:** Introduced `clipService` (list/upload/save), `sessionService` (list/join stub), and a lightweight `analytics` helper to centralize network/documentation for future backend swaps.
- **Testing:** Added RTL specs for clip play/pause toggling and the user menu dropdown. Ran `npm test` to confirm the suite passes end-to-end after each major change.

*Documented: 2025-11-13*
