# 🛠️ CityPulse — Complete Setup Guide

This guide walks you through every step to get CityPulse running locally from scratch.
Everything used here is **100% free**.

---

## Prerequisites

Make sure you have these installed:

| Tool | Version | Check with |
|---|---|---|
| Node.js | v18+ | `node --version` |
| npm | v9+ | `npm --version` |
| Git | any | `git --version` |

---

## Step 1 — Create Your Supabase Project (Free)

Supabase is free — no credit card required for the free tier.

1. Go to **[supabase.com](https://supabase.com)** and click **Start for free**
2. Sign in with GitHub or email
3. Click **New project**
4. Fill in:
   - **Organization**: your org (or create one)
   - **Project name**: `citypulse`
   - **Database password**: pick a strong password (save it!)
   - **Region**: choose the one closest to you
5. Click **Create new project** — wait ~2 minutes for it to spin up

---

## Step 2 — Enable PostGIS Extension

PostGIS powers the proximity search (find reports within 10km of you).

1. In your Supabase dashboard, go to **Database → Extensions**
2. Search for `postgis`
3. Toggle it **ON**

---

## Step 3 — Run the Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **+ New query**
3. Open the file `citypulse/supabase/schema.sql` from this project
4. Copy the **entire contents** and paste into the SQL editor
5. Click **Run** (green button)
6. You should see: `Success. No rows returned`

This creates:
- `profiles` table (linked to Supabase Auth)
- `reports` table (with PostGIS `geography` column)
- `upvotes` table (prevents duplicate voting)
- All RLS policies, indexes, triggers, and the `get_nearby_reports` RPC function

---

## Step 4 — Create the Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **New bucket**
3. Name it exactly: `report-images`
4. Check **Public bucket** ✅
5. Click **Create bucket**

Then set up storage policies:
1. Click on the `report-images` bucket
2. Go to **Policies** tab
3. Click **New policy → For full customization**
4. Create policy: **Allow public read**
   ```sql
   -- Policy name: Allow public read
   -- Operation: SELECT
   -- Target roles: public
   (bucket_id = 'report-images')
   ```
5. Create another policy: **Allow authenticated upload**
   ```sql
   -- Policy name: Allow authenticated upload
   -- Operation: INSERT
   -- Target roles: authenticated
   (bucket_id = 'report-images')
   ```

---

## Step 5 — Get Your Supabase API Keys

1. Go to **Settings → API** in your Supabase dashboard
2. You need two values:
   - **Project URL** — looks like `https://abcdefghijkl.supabase.co`
   - **anon public key** — long string starting with `eyJ...`
   - **service_role secret key** — long string (⚠️ keep this secret — backend only!)

---

## Step 6 — Set Up the Backend

```bash
cd citypulse-backend
npm install
cp .env.example .env
```

Open `.env` and fill in your values:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
PORT=3001
FRONTEND_URL=http://localhost:3000
```

⚠️ **NEVER** commit the `.env` file or expose `SUPABASE_SERVICE_ROLE_KEY` — it bypasses all RLS.

---

## Step 7 — Set Up the Frontend

```bash
cd ../citypulse-frontend
npm install
cp .env.example .env
```

Open `.env` and fill in your values:

```env
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-public-key
REACT_APP_API_URL=http://localhost:3001
```

The anon key is safe to use on the frontend — Supabase RLS protects your data.

---

## Step 8 — Start the Application

Open **two terminal windows**:

**Terminal 1 — Backend:**
```bash
cd citypulse-backend
npm run dev
# → 🏙️ CityPulse API running on port 3001
```

**Terminal 2 — Frontend:**
```bash
cd citypulse-frontend
npm start
# → Opens http://localhost:3000
```

---

## Step 9 — Create Your Account and Become Admin

1. Open **http://localhost:3000**
2. Click **Join free** and create an account
3. Check your email for a confirmation link from Supabase and click it
4. Sign in at `/login`

**Promote yourself to admin:**

1. Go back to Supabase dashboard → **SQL Editor**
2. Run this query (replace `your_username` with your actual username):
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE username = 'your_username';
   ```
3. Sign out and sign back in
4. You should now see the **Admin** link in the navbar

---

## Step 10 — Test the Features

### Submit a Report
1. Click **Report Issue** in the navbar
2. Allow browser location access when prompted
3. Select a category (e.g., Pothole)
4. Fill in title and description (min 20 chars)
5. Optionally upload a photo
6. Click **Submit Report**

### View Nearby Reports
1. On the Home page, click the **Near Me** button
2. Allow location access
3. Reports within 10km will be shown

### Upvote a Report
1. Sign in and find any report card
2. Click the upvote button (arrow icon)
3. Click again to remove your upvote

### Admin Dashboard
1. Sign in as admin
2. Navigate to `/admin`
3. Use the status buttons to move issues through: **Pending → In Progress → Resolved**
4. Expand any row to see full details and photo

---

## Troubleshooting

**"Missing Supabase environment variables"**
→ Make sure you created `.env` files (not just `.env.example`) in both subdirectories.

**"Failed to load reports"**
→ Check that your `schema.sql` ran successfully. Look for the `reports` table in Supabase Dashboard → Table Editor.

**"Location unavailable"**
→ Your browser needs HTTPS for geolocation in production. On localhost, it works over HTTP. Make sure you click "Allow" when prompted.

**"Upload failed"**
→ Confirm your `report-images` storage bucket is set to **Public** and the policies are created (Step 4).

**Email confirmation not arriving**
→ Check spam. Or in Supabase → Authentication → Providers → Email, you can temporarily disable "Confirm email" for local testing.

**Backend 403 on admin routes**
→ Confirm your profile has `role = 'admin'` in the `profiles` table. Run the UPDATE query from Step 9 again.

**PostGIS RPC not working**
→ Make sure the PostGIS extension is enabled (Step 2) and the schema.sql was run after enabling it.

---

## Deployment (Free Options)

### Frontend → Vercel (free)
```bash
npm install -g vercel
cd citypulse-frontend
vercel
# Follow prompts, add environment variables in Vercel dashboard
```

### Backend → Railway (free tier) or Render (free tier)
- **Railway**: Connect your GitHub repo, set env vars, it auto-deploys
- **Render**: Create a new Web Service, point to `citypulse-backend/`, add env vars

### Update FRONTEND_URL
Once deployed, update your backend `.env`:
```env
FRONTEND_URL=https://your-app.vercel.app
```

And update your frontend `.env`:
```env
REACT_APP_API_URL=https://your-backend.railway.app
```

---

## Free Services Summary

| Service | What it provides | Free tier limit |
|---|---|---|
| **Supabase** | DB + Auth + Storage | 500MB DB, 1GB storage, 50MB file uploads |
| **Vercel** | Frontend hosting | Unlimited projects |
| **Railway** | Backend hosting | $5/month credit (free) |
| **Render** | Backend hosting | 750 hours/month free |

All free. No credit card required (Supabase + Vercel).

---

That's it! 🎉 Your CityPulse instance is running.
