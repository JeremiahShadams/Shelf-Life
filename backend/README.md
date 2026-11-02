# 🍎 Shelf Life Estimator — Backend

A **FastAPI** backend that powers the Shelf Life Food Estimator. It uses AI models to identify food items, assess their freshness, and estimate shelf life under different storage conditions.

## 🚀 Quick Start

### 1. Create Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Mac/Linux
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
copy .env.example .env      # Windows
# cp .env.example .env      # Mac/Linux
```

### 4. Start the Server
```bash
uvicorn app.main:app --reload --port 8000
```

### 5. Open API Docs
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI entry point
│   ├── config.py         # Environment configuration
│   ├── database.py       # Async SQLAlchemy setup
│   ├── seed_data.py      # 60+ food items database seed
│   ├── routers/
│   │   ├── foods.py      # Food items CRUD
│   │   ├── scan.py       # Image scan pipeline
│   │   └── inventory.py  # User inventory management
│   ├── models/
│   │   └── schema.py     # SQLAlchemy ORM models
│   ├── schemas/
│   │   └── schemas.py    # Pydantic validation schemas
│   └── ai/
│       ├── classifier.py # Food classifier (stub → AI)
│       ├── freshness.py  # Freshness assessor (stub → AI)
│       └── estimator.py  # Shelf life calculation engine
├── models/               # AI model files (.h5)
├── uploads/              # Uploaded images
├── tests/                # Test suite
├── .env                  # Environment variables
└── requirements.txt      # Python dependencies
```

## 🔌 API Endpoints

| Method   | Endpoint              | Description                          |
|----------|-----------------------|--------------------------------------|
| `POST`   | `/api/scan/`          | Upload image → identify + estimate   |
| `GET`    | `/api/foods/`         | List all food items (with filters)   |
| `GET`    | `/api/foods/{id}`     | Get food item details                |
| `POST`   | `/api/foods/`         | Add new food item                    |
| `GET`    | `/api/foods/categories` | List food categories               |
| `GET`    | `/api/inventory/`     | Get user's inventory                 |
| `POST`   | `/api/inventory/`     | Add item to inventory                |
| `PATCH`  | `/api/inventory/{id}` | Update inventory item                |
| `DELETE` | `/api/inventory/{id}` | Remove from inventory                |
| `GET`    | `/health`             | Health check                         |
