import httpx

B = "http://127.0.0.1:8000"
c = httpx.Client(base_url=B, timeout=30)
r = c.post("/api/auth/login", json={"email": "tester@example.com", "password": "Str0ng!Pass"})
H = {"Authorization": f"Bearer {r.json()['access_token']}"}
fr = c.get("/api/fruits/", params={"search": "Banana"}).json()["items"][0]

r = c.post("/api/inventory/", headers=H, json={"fruit_id": fr["id"], "freshness_score": 0.9, "storage_method": "fridge"})
iid = r.json()["id"]
print("created", iid)
r = c.delete(f"/api/inventory/{iid}", headers=H)
print("DELETE ->", r.status_code, r.text)
r = c.get(f"/api/inventory/{iid}", headers=H)
print("GET after DELETE ->", r.status_code, r.text[:300])

r = c.post("/api/inventory/", headers=H, json={"fruit_id": fr["id"], "freshness_score": 0.9, "storage_method": "fridge"})
iid2 = r.json()["id"]

# cross-user checks
r = c.post("/api/auth/login", json={"email": "tester2@example.com", "password": "Str0ng!Pass"})
H2 = {"Authorization": f"Bearer {r.json()['access_token']}"}
r = c.patch(f"/api/inventory/{iid2}", headers=H2, json={"quantity": 2})
print("cross-user PATCH ->", r.status_code, r.text[:150])
r = c.delete(f"/api/inventory/{iid2}", headers=H2)
print("cross-user DELETE ->", r.status_code, r.text[:150])
c.delete(f"/api/inventory/{iid2}", headers=H)
