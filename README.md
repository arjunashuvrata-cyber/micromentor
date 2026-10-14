# MicroMentor

Book 15-minute "ask me anything" sessions with industry mentors.

**Architecture:** React (Vite) frontend → Python FastAPI backend (`/api`) → Supabase (Postgres)

```
Browser (React)  --fetch /api/*-->  FastAPI (api/index.py)  --service key-->  Supabase
   no secrets here                  reads .env / Vercel env vars             RLS on, no public access
```

## Features
- Sign up / log in. Passwords are hashed (PBKDF2), and sessions use signed JWT tokens.
- Mentee profile & goals are saved to Supabase and reloaded on every visit.
- Mentor list and available slots are loaded live from Supabase.
- Booking a slot is saved to Supabase. A database `unique(mentor_id, slot)` rule stops double-booking, so if someone else takes a slot first you see the "Booking Failed" screen.
- My Bookings screen with cancel.

## Project structure
```
api/index.py          FastAPI app (all /api routes)
supabase/schema.sql   Tables, security (RLS) and mentor seed data
src/                  React app
  api/client.js       The only place the frontend calls the backend
  components/         Reusable Button, InputField, FormSection, Badge
requirements.txt      Python dependencies (used by Vercel)
vercel.json           Routes /api/* to Python, everything else to React
.env.example          Template for secrets (.env itself is git-ignored)
```

---

## 1. Set up Supabase (5 min)
1. Create a free project at https://supabase.com.
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, and click **Run**.
3. Open **Table Editor**. You should see `app_users`, `profiles`, `mentors` (5 rows) and `bookings`.
4. Open **Project Settings → API Keys** and copy:
   - the **Project URL** (also under Settings → Data API)
   - the **service_role** key (in the "Legacy API keys" tab), or the new **secret** key (`sb_secret_...`)

## 2. Run locally
```bash
cp .env.example .env              # then paste your values into .env
python -c "import secrets; print(secrets.token_hex(32))"   # use the output as JWT_SECRET

pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000     # terminal 1: backend

npm install
npm run dev                                    # terminal 2: frontend -> http://localhost:5173
```
Vite forwards `/api/*` to port 8000 (see `vite.config.js`).

## 3. Push to GitHub
```bash
git init
git add .
git status          # check that .env and node_modules are NOT listed
git commit -m "MicroMentor: React + FastAPI + Supabase"
git branch -M main
git remote add origin https://github.com/<you>/micromentor.git
git push -u origin main
```

## 4. Deploy to Vercel
1. Go to https://vercel.com → **Add New → Project** and import the GitHub repo.
2. Framework preset: **Vite** (it is also set in `vercel.json`).
3. Under **Environment Variables**, add the same three values as your `.env`:
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`
4. Click **Deploy**. Then open `https://<your-app>.vercel.app/api/health`. It should show `{"status":"ok"}`.

If you add or change environment variables later, go to **Deployments → ⋯ → Redeploy** so they take effect.

## Security notes
- The Supabase keys exist only on the server, in `.env` locally and in Vercel environment variables in production. The React bundle contains no keys or URLs for Supabase.
- Row Level Security is enabled on every table with no policies, so even the public anon key can't read or write anything. Only the backend's secret key can.
- Passwords are never stored in plain text.
- Every data route checks the JWT, and a user can only see or cancel their own bookings.
