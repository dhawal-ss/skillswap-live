# Repository Guidelines

## Project Structure & Module Organization
Place all runtime code inside `src/`, grouping features by domain (e.g., `src/auth`, `src/dashboard`). Shared UI widgets belong in `src/components`, while non-UI helpers live in `src/lib`. Long-lived assets such as icons or mock data go under `assets/`. Keep integration or E2E helpers in `tests/support`, and treat anything in `scripts/` as automation only (build hooks, data seeding, etc.). Document new directories in `README.md` to keep future contributors aligned.

## Build, Test, and Development Commands
Run `npm install` once per environment to sync dependencies. Use `npm run dev` for a hot-reload developer server, and reserve `npm run build` for CI or release artifacts—it lints, type-checks, and emits production bundles into `dist/`. Execute `npm test` for the Jest unit suite, and `npm run test:watch` when iterating locally. `npm run lint` enforces ESLint + TypeScript rules; `npm run format` applies Prettier to staged files.

## Coding Style & Naming Conventions
Adopt 2-space indentation, single quotes, and trailing commas where valid. Prefer TypeScript (`.ts/.tsx`) and keep `strict` enabled. Components use PascalCase (e.g., `UserBadge`), hooks use `useCamelCase`, and utility modules are camelCase (e.g., `dateMath.ts`). Keep files under ~200 lines; split reusable logic into helper modules. Run `npm run lint && npm run format` before every push to guarantee consistent style.

## Testing Guidelines
Author Jest specs beside the source file (`Widget.tsx` → `Widget.test.tsx`). Snapshot tests should cover stable UI, while behavioral tests assert observable outcomes only. Maintain ≥90% branch coverage; `npm run test:coverage` emits reports under `coverage/`. When adding a bug fix, first reproduce with a failing test, then commit the fix and the passing test together.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat: add dashboard filter`, `fix: guard null user`). Each PR needs: a one-paragraph summary, linked issue or task ID, test plan output, and screenshots/GIFs for UI changes. Keep PRs under ~500 lines of reviewable code to simplify feedback; split larger efforts into stacked branches when necessary.

## Security & Configuration Tips
Never commit `.env`—place secrets in `.env.local` and mirror keys in `.env.example`. Review third-party packages before adding them, and run `npm audit` monthly or whenever dependencies change. Prefer environment variables for URLs/keys instead of hardcoding constants inside the source tree.
