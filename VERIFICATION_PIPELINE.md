# Verification Pipeline (AeroDrive)

This document describes the **4-stage** verification/rental flow and how to set it up locally.

> Note: The backend face match (CNN verifier) remains authoritative. The browser face-api.js step is a UX pre-check only.

---

## Architecture overview

### Stage 1 — Booking + OTP
- User books a car via `POST /api/book-car/`
- Backend sends a **6-digit OTP** to the user's email.
- OTP is stored **hashed** (HMAC-SHA256 with Django `SECRET_KEY`) and expires after **5 minutes**.

### Stage 2 — Document upload + selfie
Frontend page:
- `frontend/src/pages/Verification.jsx`

Uploads:
- Driver license image (ImageKit)
- Selfie capture (ImageKit)

Optional mock DL number:
- Backend accepts `license_number` (optional). If present, it is checked with a regex for Indian DL format.
- TODO: Replace stub with a real provider (DigiLocker / KYC vendor).

### Stage 3 — Backend identity verification
- Endpoint: `POST /api/verify-documents/`
- Verifies OTP (hash + expiry)
- Performs backend CNN face match (mock `cnn_verify.siamese_cosine_match`)
- Uses a **threshold** of `score > 0.88` and returns `confidence` as a percentage.

### Stage 4 — Driver console safety monitoring
Frontend:
- `frontend/src/pages/DriverConsole.jsx`

Endpoints:
- `POST /api/process-drowsiness/`
- `POST /api/process-phone/`

---

## Gmail (SMTP) setup (App Password)
This backend uses Django SMTP settings. For Gmail:
1. Enable 2-Step Verification on the Google account.
2. Create an **App Password**.
3. Put the Gmail address + app password into env vars:
	- `EMAIL_HOST_USER`
	- `EMAIL_HOST_PASSWORD`

If you do not set these, OTP email sending will silently fail (current code uses `fail_silently=True`).

---

## MongoDB setup
Mongo is used for cars/bookings/safety logs.
- Default: `MONGO_URI=mongodb://localhost:27017/`
- Database: `car-rent`

Collections:
- `cars`
- `bookings`
- `safety_logs`
- `aadhaar_records`

---

## face-api.js browser pre-check (optional)

### What it does
Before calling `/api/verify-documents/`, the frontend attempts a best-effort pre-check:
- "face detected" check for both images
- rough similarity score (euclidean distance between face descriptors)

### CDN dependency
The script is loaded from CDN:
- `https://unpkg.com/face-api.js@0.22.2/dist/face-api.min.js`

### Model files
Models must be present in:
- `frontend/public/models/`

See:
- `frontend/public/models/README.md`

If the CDN or models are unavailable, the UI **degrades gracefully** and backend verification still works.

---

## Environment variables
See `.env.example` (root) and `backend/.env`.

Minimum required for Stage 1–3 in a real environment:
- `MONGO_URI`
- `EMAIL_HOST_USER`
- `EMAIL_HOST_PASSWORD`
- `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_URL_ENDPOINT`

---

## How to test locally

### 1) Backend
From `backend/`:
1. `pip install -r requirements.txt`
2. `python manage.py migrate`
3. `python manage.py runserver`

### 2) Frontend
From `frontend/`:
- `npm install`
- `npm run dev`

### 3) Test the 4 stages
1. Book a car in the UI (or call `POST /api/book-car/`).
2. Check email for OTP (expires in 5 minutes).
3. Complete Verification flow:
	- upload license image
	- capture selfie
	- (optional) provide DL number if UI adds it later
4. After verified, open Driver Console and confirm drowsiness/phone endpoints are called.
