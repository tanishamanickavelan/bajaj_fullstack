# SRM Full Stack Engineering Challenge – BFHL

A REST API and frontend to process node hierarchies, detect cycles, and return structured tree insights.

---

## 🔗 Live Links

| | URL |
|---|---|
| **Frontend** | https://bajaj-frontend-tm.onrender.com |
| **Backend API** | https://bajaj-backend-frgq.onrender.com |

---

## 👤 Submission Info

| Field | Value |
|---|---|
| **Name** | Tanisha |
| **Email** | tm6668@srmist.edu.in |
| **Roll No.** | RA2311050010038 |

---

## 📁 Project Structure

```
bajaj_fullstack/
├── backend/        # Node.js + Express REST API
│   ├── index.js
│   └── package.json
├── frontend/       # React (Vite) single-page app
│   ├── src/
│   │   └── App.jsx
│   └── package.json
└── README.md
```

---

## 🚀 API Reference

### `POST /bfhl`

**Request**
```json
{
  "data": ["A->B", "A->C", "B->D", "hello", "1->2"]
}
```

**Response**
```json
{
  "user_id": "tanisha_04122005",
  "email_id": "tm6668@srmist.edu.in",
  "college_roll_number": "RA2311050010038",
  "hierarchies": [
    {
      "root": "A",
      "tree": { "A": { "B": { "D": {} }, "C": {} } },
      "depth": 3
    }
  ],
  "invalid_entries": ["hello", "1->2"],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 0,
    "largest_tree_root": "A"
  }
}
```

---

## ⚙️ Local Setup

### Backend
```bash
cd backend
npm install
npm start
# Runs on http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express |
| Frontend | React, Vite |
| Hosting | Render (Web Service + Static Site) |

---

## ✅ Features

- Validates node format (`X->Y`, single uppercase letters only)
- Detects and reports duplicate edges
- Builds nested tree structures from valid edges
- Detects cycles using DFS
- Calculates depth (longest root-to-leaf path)
- Handles diamond/multi-parent case (first-parent wins)
- CORS enabled for cross-origin requests