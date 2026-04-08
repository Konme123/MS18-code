---
description: GitHub-backed static Services CMS setup
---

# GitHub-backed Static Services CMS – Setup Guide

This project is configured so:

- The **public Services carousel** uses **static data** from `src/data/services.json` (no Supabase required).
- The **Admin page** can **edit and save** that file by committing changes to your GitHub repo using the **GitHub Contents API**.

## 1) Confirm the data file exists

- **File:** `src/data/services.json`
- This is what the public website reads.

### Data format
Each item in the array should follow this shape:

- `id` (string)
- `title` (string)
- `description` (string)
- `details` (string, optional)
- `iconSrc` (string, optional)
- `modalImageSrc` (string, optional)
- `pillStatuses` (array of strings)
  - Allowed values:
    - `available`
    - `unavailable`
    - `remote`
    - `on_site`
- `sortOrder` (number)

## 2) Create a GitHub token (PAT)

You need a GitHub token that can read/write the repository contents.

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens**.
2. Prefer **Fine-grained tokens**.
3. Select the **repository** that contains this project.
4. Give it permissions:
   - **Contents**: **Read and write**
5. Create the token and copy it.

Keep this token secret.

## 3) Add environment variables

The Admin API route reads these environment variables:

- `GITHUB_TOKEN` (required)
- `GITHUB_OWNER` (required)
- `GITHUB_REPO` (required)

Optional:
- `GITHUB_BRANCH` (defaults to `main`)
- `GITHUB_SERVICES_FILE_PATH` (defaults to `src/data/services.json`)

### Local dev (recommended)
Create a file in your project root:

- `.env.local`

Add:

```bash
GITHUB_TOKEN=YOUR_TOKEN_HERE
GITHUB_OWNER=YOUR_GITHUB_USERNAME_OR_ORG
GITHUB_REPO=YOUR_REPO_NAME
# optional
GITHUB_BRANCH=main
GITHUB_SERVICES_FILE_PATH=src/data/services.json
```

Then restart the dev server.

### Vercel/Netlify/etc.
Add the same variables in your deployment platform’s environment settings.

## 4) Ensure Admin authentication works

Admin endpoints are protected by NextAuth session.

- Login page: `/admin/login`
- Admin page: `/admin`

If you aren’t logged in, calls to `/api/admin/services` will return `401 Unauthorized`.

## 5) Test the Admin API

After setting env vars and starting the dev server:

1. Sign in at `/admin/login`
2. Open this URL in the browser:
   - `http://localhost:3000/api/admin/services`

Expected:
- A JSON payload containing:
  - `services` (array)
  - `sha` (string)

If you get an error:
- `Missing env var: GITHUB_TOKEN` → env not set
- `401 Unauthorized` → not logged in
- `GitHub API error 404` → wrong owner/repo/path/branch

## 6) Use the Admin UI to edit Services

1. Go to `/admin`
2. In **Services** section:
   - Edit title/description/details
   - Toggle pills (Available/Unavailable/Remote/On-site)
   - Add a new service
3. Click **Save services**

Expected:
- A new commit in GitHub updating `src/data/services.json`

## 7) Make the public site show the new changes

Your public site reads the repo file at build/runtime (depending on your deployment).

- If your host auto-deploys on GitHub pushes, the changes will deploy automatically.
- Otherwise:
  1. Pull the latest commit
  2. Rebuild/redeploy

## 8) Notes / limitations

- Images:
  - `iconSrc` / `modalImageSrc` can be local paths (e.g. `/icons/x.svg`) or full URLs.
- This approach makes the site independent of Supabase for services.
- Your **Journal** admin features still use Supabase.

## Troubleshooting

- **Saving fails with 500**:
  - Check server logs for `GitHub API error ...`
  - Confirm token permissions include **Contents: read/write**
- **Services don’t show on the site**:
  - Confirm the deploy picked up the latest GitHub commit
  - Confirm `src/data/services.json` content is valid JSON

---

# Optional: Split into a separate backend repo (D:\\code-backend)

If you want the GitHub-writing logic in a separate repo (so your frontend repo never contains GitHub tokens), this project supports a split setup:

- **Frontend repo (this repo, `D:\\code`)**
  - Keeps `/admin` UI
  - Keeps NextAuth login
  - Uses a **proxy API route**: `/api/admin/services`
- **Backend repo (`D:\\code-backend`)**
  - Runs a small Express server that talks to GitHub Contents API
  - Exposes:
    - `GET /services`
    - `PUT /services`
  - Protected by a shared secret header: `x-backend-secret`

## A) Backend repo setup

1. In `D:\\code-backend`, install deps:
   - `npm install`
2. Create a backend `.env` file (copy from `.env.example`) and set:
   - `PORT=5055`
   - `BACKEND_SHARED_SECRET=...` (make a strong random value)
   - GitHub env vars:
     - `GITHUB_TOKEN`
     - `GITHUB_OWNER`
     - `GITHUB_REPO`
     - `GITHUB_BRANCH` (optional)
     - `GITHUB_SERVICES_FILE_PATH` (optional)
3. Run backend:
   - `npm run dev`

Backend health:
- `http://localhost:5055/health`

## B) Frontend repo setup

In `D:\\code` add to `.env.local`:

```bash
# Where your backend is running
BACKEND_BASE_URL=http://localhost:5055

# Must match backend BACKEND_SHARED_SECRET
BACKEND_SHARED_SECRET=the-same-secret
```

Then restart the frontend dev server.

## C) Verify

1. Log in at `/admin/login`
2. Open:
   - `http://localhost:3000/api/admin/services`

Expected:
- The frontend will validate your NextAuth session, then proxy to the backend.

