"""
Live backend test — run against a running server on :8000.
Not a pytest file; execute:  .venv/Scripts/python tests/test_live_api.py
"""
import io
import json
import struct
import zlib
import httpx

BASE = "http://127.0.0.1:8000"
results: list[tuple[str, str]] = []


def check(name: str, ok: bool, detail: str = ""):
    results.append(("PASS" if ok else "FAIL", f"{name}{(' — ' + detail) if detail else ''}"))


def make_png(w: int = 64, h: int = 64) -> bytes:
    """Smallest valid PNG: solid red square."""
    def chunk(typ: bytes, data: bytes) -> bytes:
        c = struct.pack(">I", len(data)) + typ + data
        return c + struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    raw = b"".join(b"\x00" + b"\xff\x00\x00" * w for _ in range(h))
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) +
            chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b""))


with httpx.Client(base_url=BASE, timeout=60) as c:
    # ---------- System ----------
    r = c.get("/health")
    check("GET /health", r.status_code == 200, str(r.status_code))

    # ---------- Fruits ----------
    r = c.get("/api/fruits/")
    check("GET /api/fruits/", r.status_code == 200 and r.json()["total"] >= 40, f"total={r.json().get('total')}")
    r = c.get("/api/fruits/", params={"search": "banana"})
    check("Fruit search", r.status_code == 200 and any("Banana" in f["name"] for f in r.json()["items"]))
    r = c.get("/api/fruits/", params={"page": "999"})
    check("Fruit page out of range", r.status_code == 200, str(r.status_code))
    r = c.get("/api/fruits/compatibility", params={"fruits": "Banana,Avocado"})
    check("Compatibility valid names", r.status_code == 200, str(r.status_code))
    comp_resp = r.json() if r.status_code == 200 else {}
    print("COMPAT:", json.dumps(comp_resp, default=str)[:600])
    r = c.get("/api/fruits/compatibility", params={"fruits": "NotAFruit,Banana"})
    check("Compatibility unknown name (handled, not 500)",
          r.status_code in (200, 400, 404), str(r.status_code))
    if r.status_code == 200:
        print("COMPAT UNKNOWN:", json.dumps(r.json(), default=str)[:400])

    # ---------- Scan (no real model file present — expect graceful fallback or clear error) ----------
    png = make_png()
    r = c.post("/api/scan/", files={"image": ("test.png", png, "image/png")})
    scan_ok = r.status_code == 200
    check("POST /api/scan/ with PNG", r.status_code in (200, 400, 503), str(r.status_code))
    scan_response_keys = list(r.json().keys()) if r.status_code == 200 else []
    if scan_ok:
        print("SCAN RESULT KEYS:", scan_response_keys)
        print("SCAN SAMPLE:", json.dumps(r.json(), indent=2, default=str)[:1200])

    r = c.post("/api/scan/", files={"image": ("test.txt", b"not an image", "text/plain")})
    check("Scan rejects non-image", r.status_code in (400, 415, 422), str(r.status_code))

    # invalid PNG bytes claiming to be PNG
    r = c.post("/api/scan/", files={"image": ("fake.png", b"\x89PNG\r\n\x1a\ngarbage", "image/png")})
    check("Scan corrupt PNG (415 expected)", r.status_code in (400, 415, 422, 500), str(r.status_code))

    # ---------- Auth ----------
    r = c.post("/api/auth/register", json={
        "username": "tester", "email": "tester@example.com", "password": "Str0ng!Pass"})
    check("Register new user", r.status_code in (201, 409), str(r.status_code))
    token = r.json().get("access_token") if r.status_code == 201 else None

    if not token:  # test run #2
        r = c.post("/api/auth/login", json={"email": "tester@example.com", "password": "Str0ng!Pass"})
        token = r.json().get("access_token")
    check("Login works", bool(token))

    r = c.post("/api/auth/login", json={"email": "tester@example.com", "password": "wrong"})
    r2 = c.post("/api/auth/login", json={"email": "nobody@example.com", "password": "wrong"})
    check("Login enumeration protection (identical messages)",
          r.json() == r2.json(), r.json().get("detail", ""))

    r = c.post("/api/auth/register", json={
        "username": "x", "email": "bad", "password": "short"})
    check("Register weak/invalid input rejected", r.status_code in (400, 409, 422), str(r.status_code))

    H = {"Authorization": f"Bearer {token}"}

    # bad tokens
    r = c.get("/api/inventory/", headers={"Authorization": "Bearer garbage"})
    check("Invalid JWT → 401", r.status_code in (401, 403), str(r.status_code))
    r = c.get("/api/inventory/")
    check("Missing JWT → 401", r.status_code in (401, 403), str(r.status_code))

    # ---------- Inventory ----------
    r = c.get("/api/fruits/", params={"search": "Banana"})
    banana = r.json()["items"][0]
    r = c.post("/api/inventory/", headers=H, json={
        "fruit_id": banana["id"], "freshness_score": 0.9,
        "storage_method": "room_temp", "quantity": 3, "notes": "bought at market"})
    check("Add to inventory", r.status_code == 201, str(r.status_code))
    if r.status_code == 201:
        inv = r.json()
        print("ADD:", json.dumps(inv, indent=2, default=str)[:800])
        item_id = inv["id"]

        # is a notification row created?
        r = c.get("/api/inventory/", headers=H)
        data = r.json()
        check("Inventory summary stats", {"items", "total", "expiring_soon", "expired"} <= set(data.keys()),
              f"keys={list(data.keys())}")

        r = c.get(f"/api/inventory/{item_id}", headers=H)
        check("Get item detail", r.status_code == 200, str(r.status_code))

        r = c.patch(f"/api/inventory/{item_id}", headers=H, json={"quantity": 1})
        check("Patch quantity", r.status_code == 200 and r.json()["quantity"] == 1)

        # LAW TEST: storage change AFTER days have passed
        r = c.patch(f"/api/inventory/{item_id}", headers=H, json={"storage_method": "fridge"})
        check("Patch storage method", r.status_code == 200, str(r.status_code))
        patched = r.json()
        print("AFTER STORAGE SWITCH:", json.dumps(
            {k: patched[k] for k in ("scanned_at", "storage_method",
                                     "estimated_days_remaining", "estimated_expiry")},
            indent=2, default=str))

        r = c.patch(f"/api/inventory/{item_id}", headers=H, json={"is_consumed": True})
        check("Mark consumed", r.status_code == 200 and r.json()["is_consumed"] is True)

        r = c.delete(f"/api/inventory/{item_id}", headers=H)
        check("Delete item", r.status_code == 200, str(r.status_code))
        r = c.get(f"/api/inventory/{item_id}", headers=H)
        check("Deleted item now 404", r.status_code == 404, str(r.status_code))

        # ---------- Cross-user isolation ----------
        r = c.post("/api/auth/register", json={
            "username": "tester2", "email": "tester2@example.com", "password": "Str0ng!Pass"})
        tok2 = r.json().get("access_token")
        if not tok2:
            r = c.post("/api/auth/login", json={"email": "tester2@example.com", "password": "Str0ng!Pass"})
            tok2 = r.json().get("access_token")
        # tester2 adds an item
        r = c.post("/api/inventory/", headers={"Authorization": f"Bearer {tok2}"}, json={
            "fruit_id": banana["id"], "freshness_score": 0.8, "storage_method": "fridge"})
        other_id = r.json()["id"]
        # tester1 tries to patch tester2's item
        r = c.patch(f"/api/inventory/{other_id}", headers=H, json={"quantity": 0})
        check("Cross-user PATCH blocked", r.status_code == 404, str(r.status_code))
        r = c.delete(f"/api/inventory/{other_id}", headers={"Authorization": f"Bearer {tok2}"})
        check("Owner cleanup", r.status_code == 200)

    # ---------- Notifications ----------
    r = c.get("/api/notifications", headers=H)
    check("Notifications endpoint", r.status_code in (200, 404, 405),
          f"{r.status_code} — {'EXISTS' if r.status_code == 200 else 'MISSING'}")

    # does inventory add create notification rows we can ever read?
    r = c.post("/api/inventory/", headers=H, json={
        "fruit_id": banana["id"], "freshness_score": 0.9, "storage_method": "fridge"})
    print("RE-ADD:", r.status_code)

    # ---------- Storage-toggle clock-reset regression ----------
    # Simulate elapsed time by backdating the row directly in SQLite, then
    # verify a storage switch cannot resurrect days that were already spent.
    import sqlite3, pathlib
    db_file = pathlib.Path("shelf_life_dev.db").resolve()

    r = c.post("/api/inventory/", headers=H, json={
        "fruit_id": banana["id"], "freshness_score": 0.9, "storage_method": "fridge"})
    tog_id = r.json()["id"]
    print(f"TOGGLE SETUP: fresh fridge item days={r.json()['estimated_days_remaining']:.2f}")

    with sqlite3.connect(db_file) as conn:
        conn.execute(
            "UPDATE user_inventory SET scanned_at = datetime(scanned_at, '-5 days'), "
            "estimated_expiry = datetime(estimated_expiry, '-5 days') WHERE id = ?",
            (tog_id,),
        )

    r = c.get(f"/api/inventory/{tog_id}", headers=H)
    body = r.json()
    print(f"TOGGLE BACKDATED: days_left={body['days_left']:.2f} status={body['status']} "
          f"is_expired={body['is_expired']}")
    check("Backdated item is truthfully near-zero days", body["days_left"] <= 1.0,
          f"days_left={body['days_left']:.2f}")
    check("Status reflects EAT_TODAY/SPOILED state", body["status"] in ("EAT_TODAY", "SPOILED"),
          body["status"])
    check("is_expired recomputed from expiry date (not stale flag)",
          body["is_expired"] is False or body["days_left"] <= 0)

    # Now 'switch to the freezer' when the fruit is nearly dead.
    # OLD code: expiry = scanned_at + full freezer life  -> days ~ +175 from now (resurrection)
    # NEW code: only the remaining fraction of life carries over -> days must stay small.
    r = c.patch(f"/api/inventory/{tog_id}", headers=H, json={"storage_method": "freezer"})
    body = r.json()
    print(f"TOGGLE FREEZER: days_left={body['days_left']:.2f}")
    check("Storage switch cannot resurrect spent days", body["days_left"] <= 25,
          f"days_left={body['days_left']:.2f} (old bug gave ~175)")

    # days_left in response is live-computed from expiry, not the at-scan snapshot
    check("days_left response field is live-computed",
          body["days_left"] <= body["estimated_days_remaining"] + 0.01)
    c.delete(f"/api/inventory/{tog_id}", headers=H)

    # unknown fruit partially known → flagged not ignored
    r = c.get("/api/fruits/compatibility", params={"fruits": "Banana,Zzzz"})
    check("Partial unknown names flagged", r.status_code == 200 and r.json().get("unknown_names") == ["Zzzz"],
          str(r.json().get("unknown_names")))
    r = c.get("/api/fruits/compatibility", params={"fruits": "Zzzz,Yyyy"})
    check("All-unknown names → 404", r.status_code == 404, str(r.status_code))

    # corrupt PNG → clean 415
    r = c.post("/api/scan/", files={"image": ("fake.png", b"\x89PNG\r\n\x1a\ngarbage", "image/png")})
    check("Corrupt PNG → 415 (not 500)", r.status_code == 415, str(r.status_code))

    # missing model → 503 with human message (when artifact absent)
    r = c.post("/api/scan/", files={"image": ("test.png", png, "image/png")})
    if r.status_code == 503:
        check("Scan without model → 503 + guidance", "manually" in r.text.lower(), str(r.status_code))
    else:
        check("Scan PNG", r.status_code == 200, str(r.status_code))

    # health exposes AI state
    r = c.get("/health")
    check("Health exposes ai_scanning", r.json().get("ai_scanning") in ("available", "unavailable"),
          str(r.json().get("ai_scanning")))

print("\n" + "=" * 70)
fails = 0
for status, msg in results:
    if status == "FAIL":
        fails += 1
    safe = msg.replace("\u2192", "->")
    try:
        print(f"[{status}] {safe}")
    except UnicodeEncodeError:
        print(f"[{status}] {safe.encode('ascii', 'replace').decode()}")
print("=" * 70)
print(f"{len(results) - fails} passed, {fails} failed")
