# AeroDrive Platform

AeroDrive is a state-of-the-art car rental system featuring real-time CNN biometric verification, Aadhaar-based identity gating, OTP car access, and live in-vehicle driver monitoring.

## 🎨 Design Philosophy
"Resonant Stark" Premium Dark UI
- Modern, clean dark surfaces with micro-animations
- High precision typography (Inter/Space Grotesk)
- Real-time data panels with gradient meshes and glassmorphism

## 📂 Project Structure
- `backend/`: Django backend simulating deep learning verification logic and providing REST APIs.
- `frontend/`: Vite + React + Tailwind CSS frontend with a cinematic UI and live camera feed processing.

## ⚙️ Setup & Wiring

### 1. Backend Setup (Django)

```bash
cd backend
python -m venv venv
# Activate venv (Windows: venv\Scripts\activate, Mac/Linux: source venv/bin/activate)
pip install django djangorestframework django-cors-headers opencv-python Pillow
python manage.py migrate
python manage.py seed_cars
python manage.py runserver 8000
```
*(The `seed_cars` command will populate the database with 9 mock cars and 3 mock Aadhaar records.)*

### 2. Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

CORS is pre-configured to allow `localhost:5173` to access the Django backend endpoints.

### API Routes Integrated:
- `GET /api/cars/`: Fetch fleet list
- `POST /api/verify-aadhaar/`: Trigger Siamese CNN face matching
- `POST /api/send-otp/`: Send mock SMS OTP for vehicle access
- `POST /api/verify-otp/`: Issue secure unlock token
- `POST /api/process-drowsiness/`: Process driver's Eye Aspect Ratio (EAR) 4x/sec
- `POST /api/process-phone/`: Process phone detection via mock YOLO bounding boxes
- `GET /api/safety-logs/{user_id}/`: Retrieve telemetry history

## 🚀 Features
1. **Aadhaar Biometric Gate:** Face matched against government ID in <3 seconds.
2. **OTP Physical Unlock:** Digital key code generated dynamically.
3. **Edge-AI Drowsiness Guard:** Real-time driver monitoring simulation with blaring alerts.
4. **Phone Usage Detection:** Simulated object detection for distraction alerts.
5. **Live Telematics HUD:** High-tech in-vehicle telemetry dashboard interface.
