# Taipei Parks Explorer

A full-stack app: a **React (Vite)** front end talking to a **Flask REST API** that
serves **830 Taipei parks** from the city's open data. Search, filtering and pagination
are all handled server-side.

- **Frontend** → hosted on **Vercel**
- **Backend** → hosted on **Render**

## Structure

```
Taipei Parks Explorer/
├─ .gitignore
├─ render.yaml              # Render Blueprint (deploys the backend)
├─ backend/
│  ├─ app.py               # Flask REST API
│  ├─ taipei_parks.json    # 830 parks (open-data snapshot)
│  └─ requirements.txt
└─ frontend/
   ├─ vercel.json          # proxies /api/* → the Render backend
   ├─ index.html
   ├─ package.json
   ├─ vite.config.js       # local dev proxy → http://localhost:5001
   └─ src/
      ├─ main.jsx
      ├─ App.jsx
      ├─ styles.css
      └─ components/
         ├─ ParksExplorer.jsx
         └─ ParkModal.jsx
```

---

## Run locally

Two terminals from this folder.

**1. Backend (Flask API on :5001)**

```bash
cd backend
python3 -m venv venv && source venv/bin/activate   # optional
pip install -r requirements.txt
python app.py            # http://localhost:5001
```

**2. Frontend (Vite dev server on :5173)**

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

In dev, `vite.config.js` proxies `/api/*` to Flask on `:5001`, so the React app calls
`/api/parks` with no CORS fuss.

---

## Deploy

The frontend and backend deploy **independently** from the same repo. Push this folder
to its own GitHub repository first.

### 1. Backend → Render

1. In Render: **New + → Blueprint**, and select this repo.
2. Render reads `render.yaml`, builds only `backend/`, and starts it with
   `gunicorn app:app --bind 0.0.0.0:$PORT`.
3. When it goes live you get a URL like `https://taipei-parks-api.onrender.com`.
   Confirm it works: open `…/api/health` — you should see `{"status":"ok","count":830}`.

### 2. Connect the frontend to that backend

Open `frontend/vercel.json` and replace the placeholder host with your real Render URL:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://taipei-parks-api.onrender.com/api/:path*"
    }
  ]
}
```

This makes the browser call `/api/...` on your **own Vercel domain**, and Vercel
transparently forwards it to Render. Because it's same-origin from the browser's point
of view, **there's no CORS to configure** and no code change to the components.

### 3. Frontend → Vercel

1. In Vercel: **Add New → Project**, import the same repo.
2. Set **Root Directory** to `frontend`.
3. Vercel auto-detects Vite: Build Command `npm run build`, Output Directory `dist`.
4. Deploy. Your site (e.g. `https://taipei-parks-explorer.vercel.app`) now serves the
   React app and proxies `/api/*` to Render.

---

## API

| Method | Path                                        | Notes                                                  |
| ------ | ------------------------------------------- | ------------------------------------------------------ |
| GET    | `/api/health`                               | `{status, count}`                                      |
| GET    | `/api/filters`                              | `{types[], areas[]}`                                   |
| GET    | `/api/parks?search&type&area&page&per_page` | envelope `{total, page, perPage, totalPages, items[]}` |
| GET    | `/api/parks/<id>`                           | one park, or `404`                                     |
| POST   | `/api/contact`                              | demo validation endpoint                               |

## How it fits together

```
Browser ──/api/*──▶ Vercel (React static site)
                        │  vercel.json rewrite
                        ▼
                    Render (Flask API) ──▶ taipei_parks.json (830 parks, in memory)
```

Data: Taipei City Government open data.
