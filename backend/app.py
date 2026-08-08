import json
import os
import re
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "taipei_parks.json")
DIST_DIR = os.path.join(BASE_DIR, "..", "frontend", "dist")

app = Flask(__name__, static_folder=None)
CORS(app)  # allow the Vite dev server to call the API during development


def _s(value):
    """Null-safe string: turn None into '' and strip whitespace."""
    if value is None:
        return ""
    return str(value).strip()


def _num(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def normalize(raw):
    """Turn a raw park record into a clean, predictable dict."""
    return {
        "id": _s(raw.get("SeqNo")),
        "name": _s(raw.get("pm_name")),
        "nameEng": _s(raw.get("pm_name_eng")),
        "type": _s(raw.get("pm_type")),
        "area": _s(raw.get("pm_unit")),          # management area / office
        "overview": _s(raw.get("pm_overview")),
        "location": _s(raw.get("pm_location")),
        "landArea": _s(raw.get("pm_LandPublicArea")),
        "openStart": _s(raw.get("pm_opening_s")),
        "openEnd": _s(raw.get("pm_opening_e")),
        "phone": _s(raw.get("pm_phone")),
        "transit": _s(raw.get("pm_transit")),
        "sports": _s(raw.get("pm_sports")),
        "recreation": _s(raw.get("pm_recreation")),
        "service": _s(raw.get("pm_service")),
        "lng": _num(raw.get("pm_Longitude")),
        "lat": _num(raw.get("pm_Latitude")),
        "constYear": _s(raw.get("pm_const_year")),
    }


def load_parks():
    with open(DATA_PATH, encoding="utf-8") as fh:
        rows = json.load(fh)
    return [normalize(r) for r in rows]


PARKS = load_parks()
# Build filter option lists once at startup.
TYPES = sorted({p["type"] for p in PARKS if p["type"]})
AREAS = sorted({p["area"] for p in PARKS if p["area"]})


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "count": len(PARKS)})


@app.get("/api/filters")
def filters():
    return jsonify({"types": TYPES, "areas": AREAS})


@app.get("/api/parks")
def parks():
    search = _s(request.args.get("search")).lower()
    ptype = _s(request.args.get("type"))
    area = _s(request.args.get("area"))

    try:
        page = max(1, int(request.args.get("page", 1)))
    except ValueError:
        page = 1
    try:
        per_page = min(48, max(1, int(request.args.get("per_page", 12))))
    except ValueError:
        per_page = 12

    results = PARKS
    if ptype:
        results = [p for p in results if p["type"] == ptype]
    if area:
        results = [p for p in results if p["area"] == area]
    if search:
        results = [
            p for p in results
            if search in p["name"].lower()
            or search in p["nameEng"].lower()
            or search in p["location"].lower()
            or search in p["overview"].lower()
        ]

    total = len(results)
    start = (page - 1) * per_page
    page_items = results[start:start + per_page]

    return jsonify({
        "total": total,
        "page": page,
        "perPage": per_page,
        "totalPages": (total + per_page - 1) // per_page,
        "items": page_items,
    })


@app.get("/api/parks/<seqno>")
def park_detail(seqno):
    for p in PARKS:
        if p["id"] == str(seqno):
            return jsonify(p)
    return jsonify({"error": "Park not found"}), 404


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@app.post("/api/contact")
def contact():
    """Demo endpoint showing back-end validation (mirrors the front-end checks)."""
    data = request.get_json(silent=True) or {}
    name = _s(data.get("name"))
    email = _s(data.get("email"))
    message = _s(data.get("message"))

    errors = {}
    if not name:
        errors["name"] = "Name is required."
    if not email:
        errors["email"] = "Email is required."
    elif not EMAIL_RE.match(email):
        errors["email"] = "Email format is invalid."
    if not message:
        errors["message"] = "Message is required."
    elif len(message) < 10:
        errors["message"] = "Message must be at least 10 characters."

    if errors:
        return jsonify({"ok": False, "errors": errors}), 400
    return jsonify({"ok": True, "message": "Thanks! Your message passed validation."})


# --- Serve the built React app in production (single Render service) ---
@app.get("/", defaults={"path": ""})
@app.get("/<path:path>")
def serve_spa(path):
    target = os.path.join(DIST_DIR, path)
    if path and os.path.exists(target):
        return send_from_directory(DIST_DIR, path)
    index = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index):
        return send_from_directory(DIST_DIR, "index.html")
    return jsonify({"error": "Frontend not built yet. Run `npm run build` in /frontend."}), 404


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
