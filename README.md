# PE Dispatch Board — Performance East Service Department

A web-based service dispatch board for Performance East Inc., replacing the multi-tab Excel dispatch spreadsheet with an interactive, persistent, filterable job management tool.

## Features

- **Job Queue** — Sortable, filterable master list of all jobs (mirrors the Priority Matrix spreadsheet)
- **Tech View** — Per-technician workload cards showing open jobs, hours queued, and inline status updates
- **Dashboard** — Real-time department stats, tech utilization bars, and parts bottleneck tracker
- **Persistent Storage** — All data saves automatically to browser localStorage
- **Export / Import** — JSON backup and restore for data portability
- **Double-click to edit** — Full job editing with all fields
- **Archive Completed** — Clear finished jobs with one click

## Tech Stack

- React 18 + Vite
- No external UI libraries — lightweight and fast
- localStorage for persistence (no backend needed)
- Google Fonts: Oswald, DM Mono, Outfit

## Deploy to Vercel

### Option 1: GitHub + Vercel (Recommended)

1. **Create a GitHub repo:**
   ```bash
   cd pe-dispatch
   git init
   git add .
   git commit -m "Initial commit - PE Dispatch Board"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/pe-dispatch.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - Click "Add New Project"
   - Import your `pe-dispatch` repository
   - Framework Preset: **Vite**
   - Click **Deploy**

3. **Done!** Your dispatch board will be live at `pe-dispatch.vercel.app` (or a custom domain)

### Option 2: Vercel CLI

```bash
npm install -g vercel
cd pe-dispatch
vercel
```

## Local Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Data Management

- **Auto-save**: Every change saves immediately to browser localStorage
- **Export**: Settings gear → Export JSON (creates a downloadable backup file)
- **Import**: Settings gear → Import JSON (restores from a backup file)
- **Reset**: Settings gear → Reset Data (returns to seed data)
- **Archive**: Settings gear → Archive Completed (removes all completed jobs)

> **Note**: localStorage is per-browser. If you use the board on multiple devices, use Export/Import to sync data between them. For multi-user real-time sync, a backend database (like Supabase or Firebase) would be the next upgrade.

## Technicians

Pre-configured with your current team:
- Jake — Marine / Watercraft
- Tyler — Marine PDI / Electrical
- Danny — Offroad / Engine Work
- Ray — Offroad / Diagnostics
- Cody — Offroad / Accessories

To add or change techs, edit `src/data/constants.js`.

## Future Enhancements

- [ ] Multi-user real-time sync (Supabase/Firebase)
- [ ] Drag-and-drop daily scheduling per tech
- [ ] SMS/push notifications for status changes
- [ ] Daily hours tracking with clock-in/clock-out
- [ ] CSV export for reporting
- [ ] Mobile-optimized tech view
- [ ] Custom domain (e.g., dispatch.pegoldsboro.com)
