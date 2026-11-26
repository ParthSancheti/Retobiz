# Retobiz — Hyperlocal Retail Discovery & Merchant Growth OS (prototype)

Next.js 16 · TypeScript · Tailwind v4 · Motion · Zustand (localStorage) · Lucide

```bash
npm install
npm run dev            # http://localhost:3000
npm run images:verify  # HEAD-check every curated photo URL (needs internet)
npm run check          # typegen + tsc + eslint + next build
npm run images:cache   # optional: download photos to /public/img for offline demos
```

Demo tips: open `/`, `/merchant` and `/admin` in three tabs. Actions sync live across tabs.
Use the floating **Demo** pill (bottom-left on desktop) to switch roles, change the demo shop, or reset data.

See `DESIGN.md` and `IMPLEMENTATION_PLAN.md`.
