# AeroDrive

A car-rental prototype with a React interface and a Django API. It connects fleet browsing, reservations, email OTPs, document uploads, and a driver-monitoring demonstration.

**Project status:** the rental workflows are implemented as a prototype. Face matching, eye-aspect-ratio detection, and phone detection in the backend return simulated values. They are not validated biometric or vehicle-safety systems. The current frontend also has build-blocking JSX errors; see [verification and known gaps](#verification-and-known-gaps).

## Features

- User registration and login with JWT access and refresh tokens.
- Fleet browsing, date-based reservations, reservation history, cancellation, and ride completion.
- Booking OTP expiry and hashed server-side OTP checks; email delivery can use a local console backend.
- ImageKit integration for document and selfie uploads.
- Admin pages for bookings, cars, damage reports, and safety events.
- A driver console that demonstrates drowsiness and distraction alerts using simulated backend outputs.

## Stack and architecture

| Layer | Implementation |
| --- | --- |
| Interface | React, JavaScript, Vite, Tailwind CSS, Framer Motion |
| API | Django, Django REST Framework dependencies, Simple JWT |
| Account storage | SQLite through Django's ORM |
| Rental data | MongoDB through PyMongo; the database is named `car-rent` |
| Uploads | ImageKit |
| OTP delivery | Django email backend; console output for local development |

```text
frontend/                       React screens, routing, authentication helpers
backend/aerodrive/               Django settings and top-level routes
backend/rental_core/views.py     API handlers and MongoDB rental workflows
backend/rental_core/utils/      Upload, OTP, and simulated verification helpers
```

## Local setup

Prerequisites: Python with `venv`, Node.js 22.12+ with npm, and a local MongoDB instance. Dependency installation was checked with Python 3.13 and Node.js 22.19; this is not a full compatibility matrix.

```bash
git clone https://github.com/Sandeshkumar0/aerodrive_rental.git
cd aerodrive_rental/backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

On Windows, activate with `.venv\Scripts\activate`. Create `backend/.env` with local development settings:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017/
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

For document uploads, add your own `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_PUBLIC_KEY`, and `IMAGEKIT_URL_ENDPOINT` to that file. Keep the private key on the backend. SMTP delivery additionally requires the email settings listed in [backend/README.md](backend/README.md).

```bash
python manage.py check
python manage.py migrate
python manage.py runserver 8000
```

For a **fresh, disposable local MongoDB database only**, populate the sample fleet from a second activated backend terminal:

```bash
python manage.py seed_cars
```

The seed command deletes existing `cars` and `aadhaar_records` collections before inserting sample data. Do not run it against a database you need to preserve.

Start the frontend in another terminal:

```bash
cd aerodrive_rental/frontend
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. Vite proxies `/api` requests to `http://localhost:8000`. If you are already in the repository root, use `cd frontend` instead of `cd aerodrive_rental/frontend`.

For upload screens, create `frontend/.env.local`:

```dotenv
VITE_IMAGEKIT_PUBLIC_KEY=your_public_key
VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_account/
```

The current JSX errors must be corrected before those screens can compile. Adding environment variables does not fix the build errors.

## Usage and API entry points

After resolving the frontend build errors, browse the fleet, register a local test account, reserve a car, and read the booking OTP from the backend terminal when using console email. Document upload and verification screens require ImageKit configuration. The monitoring screen demonstrates simulated alerts.

| Route | Purpose |
| --- | --- |
| `GET /api/cars/` | Fleet listing |
| `POST /api/auth/register/`, `POST /api/auth/login/` | Account access |
| `POST /api/book-car/` | Start a reservation |
| `GET /api/reservations/<user_id>/` | Reservation history |
| `POST /api/verify-otp/` | Verify booking OTP |
| `POST /api/verify-documents/` | Prototype document-verification flow |
| `POST /api/process-drowsiness/`, `POST /api/process-phone/` | Simulated monitoring |

See [the route definitions](backend/rental_core/urls.py) and their handlers for request fields and authentication behavior. Do not assume every endpoint currently enforces the same authorization rules.

## Verification and known gaps

Checks against the source reviewed on 2026-10-21:

- `pip install -r requirements.txt` and `python manage.py check` succeeded.
- `python manage.py test` discovered **zero tests**; it does not establish behavior coverage.
- `npm ci` succeeded, but `npm run build` failed on malformed animation props in `MyReservations.jsx` and `Verification.jsx`.
- `npm run lint` reported those parsing errors and a state-update-in-effect error in `AdminDashboard.jsx`.
- MongoDB-backed bookings, SMTP delivery, and ImageKit uploads were not exercised end to end during the documentation review.

The next useful changes are to fix the JSX, test reservation ownership and concurrent booking, add OTP expiry/attempt tests, and document authorization consistently. Django currently hardcodes development settings; several `DJANGO_*` variables in the root example file do not override those settings.

The optional browser face pre-check also needs model files that are not committed; see [frontend/public/models/README.md](frontend/public/models/README.md). Its references to an “authoritative” backend CNN should not be interpreted as real biometric verification: the backend implementation in [cnn_verify.py](backend/rental_core/utils/cnn_verify.py) is simulated. [VERIFICATION_PIPELINE.md](VERIFICATION_PIPELINE.md) contains additional design notes; distinguish proposed behavior from implemented handlers.

## Demo and screenshots

No public demo was confirmed during this review. UI screenshots are not included yet. Useful additions are a fleet view, reservation flow, and admin view captured from a working local build using synthetic data. Add image links only after the files exist; avoid including real identity documents or personal account data.
