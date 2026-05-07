# PillPal

PillPal is a lightweight demo app for **medication reminders**, **simple user login**, and **device binding**, built with **React + Vite** and **Supabase**.  
It is designed as a small course project to demonstrate a complete flow: reminders → confirmation → event history, with optional device-side interaction (simulated).

## What the App Does

- **Login (demo)**: Identify a user by phone number (stored in the `users` table).
- **Reminders**: Create, edit, and delete medication reminders (`medication_reminders`).
- **Confirm actions**: Confirm a reminder in the app and store an event (`pill_event`, e.g. `confirmed_by_app`).
- **Device binding**: Bind a `device_id` to the current user (`device_bindings`).
- **History**: View event history (`pill_event`) with filtering by event type.

## Tech Stack

- React + Vite
- Supabase (Postgres + JavaScript client)
- TailwindCSS + shadcn/ui

## Project Structure

This repository contains the app under:

- `pillpal/` — Vite project root (this is where you run npm commands)

## Getting Started (Local)

### 1) Install dependencies

```bash
cd pillpal
npm install
```

### 2) Configure environment variables

Copy the example file and fill in your Supabase credentials:

```bash
# from inside the pillpal folder
cp .env.example .env.local
```

Then edit `pillpal/.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_DEFAULT_DEVICE_ID=demo_device_01
```

### 3) Run the dev server

```bash
npm run dev
```

Open the local URL shown in the terminal (typically `http://localhost:5173/`).

## Supabase Database Schema (Expected Tables)

This app expects the following tables in Supabase:

### `users`
- `id` (uuid, primary key, default `gen_random_uuid()`)
- `phone` (text, unique)

### `medication_reminders`
- `id` (bigint or uuid, primary key)
- `user_id` (uuid, foreign key → `users.id`)
- `remind_time` (time)
- `memo` (text)
- `is_active` (boolean)
- `created_at` (timestamp)

### `pill_event`
- `id` (bigint or uuid, primary key)
- `user_id` (uuid, foreign key → `users.id`)
- `event_time` (timestamp)
- `event_type` (text)
- `voltage` (numeric, nullable)
- `memo` (text, nullable)

### `device_bindings`
- `device_id` (text, primary key)
- `user_id` (uuid, foreign key → `users.id`)
- `bound_at` (timestamp, default `now()`)

## Scripts

From `pillpal/`:

- `npm run dev` — start development server
- `npm run build` — build for production
- `npm run preview` — preview production build locally
- `npm run lint` — run ESLint

## Common Troubleshooting

### `@/...` imports cannot be resolved
This project uses an `@` path alias to `src`. Make sure you run the dev server from the `pillpal/` directory and that `pillpal/vite.config.js` contains the alias mapping.

### Supabase requests fail / return permission errors
If you enabled RLS (Row Level Security) in Supabase, you must add appropriate policies. For a small demo project, you can also disable RLS on the tables to simplify setup.

## License

For educational use.