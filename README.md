# 🏙️ CityPulse v2.0 — Debugged & Feature-Complete

CityPulse is a full-stack civic issue reporting platform built with **React**, **Node.js/Express**, and **Supabase** (PostgreSQL + Auth + Storage + PostGIS).

---
<div align="center">
  <a href="https://city-pulse-bd.vercel.app/"><strong>Explore City Pulse Live »</strong></a>
</div>
---

##  What's Fixed & New in v2.0

###  — Critical Bug Fixes

| Bug | Root Cause | Fix |
|---|---|---|
| **Signup loses focus on every keystroke** | `InputField` was defined *inside* `Signup` function body — React created a new component type on every render, unmounting the input | `InputField` hoisted **outside** `Signup` scope in `Signup.jsx` |
| **Sign-out navigates to `/` instead of `/login`** | `Navbar.handleSignOut` called `navigate('/')` | Changed to `navigate('/login', { replace: true })` — users land on the login screen |
| **Report submission "invalid, can't submit"** | `.single()` on the upvote existence check threw PGRST116 when no row existed; `latitude`/`longitude` were required even for manual-address reports | Changed to `.maybeSingle()` throughout; backend now accepts either GPS coordinates or `location_text` |

###  — Geolocation Toggle (Mutually Exclusive)
- New **Location Mode** picker on the Report form: **Live GPS** vs **Type Location**
- Selecting one automatically clears and disables the other
- Manual mode uses **Nominatim (OpenStreetMap)** geocoding — free, no API key required
- Confirmed address stored in `reports.location_text` column

###  — Full Profile Management (`/profile`)
- **Update display name & username** (synced to Supabase auth metadata)
- **Upload profile picture** → stored in `avatars` Supabase Storage bucket
- **Change password** via `supabase.auth.updateUser()`
- **Forgot Password** page (`/forgot-password`) → `supabase.auth.resetPasswordForEmail()`
- **Reset Password** page (`/reset-password`) → handles Supabase email callback token

###  — Phone Authentication (OTP)
- New **Phone OTP** tab on the Login page
- Sends SMS via `supabase.auth.signInWithOtp({ phone })`
- Verifies via `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`
- Supports international format (e.g. `+8801XXXXXXXXX` for Bangladesh)
- Requires Phone provider enabled in: **Supabase Dashboard → Authentication → Providers → Phone**

###  — Gamification Engine
- **Database columns**: `profiles.points` (integer, default 0) + `profiles.badge` (text, default 'none')
- **DB Trigger** `on_report_resolved`: awards +100 points whenever a report's `status` changes to `resolved`
- **Auto-badge**: `compute_badge()` SQL function updates badge tier on every points update
  - 🌱 0 pts = Newcomer
  - 🥉 1,000 pts = Bronze
  - 🥈 5,000 pts = Silver
  - 🥇 10,000 pts = Gold
  - 💎 100,000 pts = Platinum
- **Feed JOIN**: `reports` joined with `profiles(points, badge, avatar_url)` — every `ReportCard` displays reporter name, avatar, points, and badge icon
- **Admin note**: resolving a report shows toast: *"Reporter awarded 100 pts!"*

---

##  Project Structure

```
citypulse/
├── citypulse-frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BadgeIcon.jsx          ← NEW (Task 5)
│   │   │   ├── ImageUpload.jsx
│   │   │   ├── Navbar.jsx             ← FIXED (Task 1)
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── ReportCard.jsx         ← UPDATED (Task 5)
│   │   │   ├── StatusBadge.jsx
│   │   │   └── UpvoteButton.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx        ← FIXED + UPDATED (Task 1, 3, 4)
│   │   ├── lib/
│   │   │   └── supabaseClient.js
│   │   └── pages/
│   │       ├── AdminDashboard.jsx     ← UPDATED (Task 5)
│   │       ├── ForgotPassword.jsx     ← NEW (Task 3)
│   │       ├── Home.jsx               ← UPDATED (Task 5)
│   │       ├── Login.jsx              ← UPDATED (Task 4)
│   │       ├── ProfileSettings.jsx    ← NEW (Task 3)
│   │       ├── ReportIssue.jsx        ← UPDATED (Task 2)
│   │       ├── ResetPassword.jsx      ← NEW (Task 3)
│   │       └── Signup.jsx             ← FIXED (Task 1)
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   └── tailwind.config.js
│
├── citypulse-backend/
│   ├── controllers/
│   │   └── reportController.js        ← FIXED (Task 1)
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   └── reportRoutes.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── supabase/
    └── schema.sql                     ← UPDATED (Task 5 + location_text)
```

---

##  Local Setup

### 1. Supabase Project Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase/schema.sql`
3. Go to **Database → Extensions** → enable **PostGIS**
4. Go to **Storage** → create two public buckets:
   - `report-images`
   - `avatars`
5. **Phone Auth** (Task 4): **Authentication → Providers → Phone** → enable + configure Twilio/WhatsApp

### 2. Backend

```bash
cd citypulse-backend
npm install
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

### 3. Frontend

```bash
cd citypulse-frontend
npm install
cp .env.example .env
# Fill in REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY
npm start
```

### 4. Promote yourself to Admin

After signing up, run in **Supabase SQL Editor**:

```sql
UPDATE public.profiles SET role = 'admin' WHERE username = 'your_username';
```

---

##  Key Database Notes

- **`profiles` table**: includes `points` and `badge` columns for gamification
- **`reports` table**: includes `location_text` (nullable) for manual address entry; `latitude`/`longitude` are now nullable (PostGIS trigger only fires if both are set)
- **Trigger `on_report_resolved`**: automatically fires when `reports.status` is updated to `resolved` — no application code needed
- **RPC `get_nearby_reports`**: returns reporter profile fields (`reporter_name`, `reporter_avatar`, `reporter_points`, `reporter_badge`)

---

##  Future Roadmap

- **Realtime**: Supabase Realtime subscriptions for live feed updates
- **Notifications**: Webhook → email when report status changes
- **Analytics**: D3.js / Chart.js dashboard for issue category trends over time
- **Leaderboard**: Top reporters ranked by points
