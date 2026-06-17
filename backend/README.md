## AeroDrive backend (Django)

### Quick start
1. Create a virtualenv and install deps:
	- `pip install -r requirements.txt`
2. Create `backend/.env` (or set env vars) and run:
	- `python manage.py migrate`
	- `python manage.py runserver`

### Key environment variables
- `MONGO_URI` (default: `mongodb://localhost:27017/`)
- `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_URL_ENDPOINT`
- Email (OTP delivery):
	- `EMAIL_HOST` (default: `smtp.gmail.com`)
	- `EMAIL_PORT` (default: `587`)
	- `EMAIL_USE_TLS` (default: `True`)
	- `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
	- `DEFAULT_FROM_EMAIL`

### OTP security
- Booking OTPs are sent via email.
- OTPs expire after **5 minutes**.
- OTPs are stored **hashed** server-side (HMAC-SHA256 using Django `SECRET_KEY`).

### Document verification
- Driving license number verification is currently a **mock/stub** (Indian DL regex).
- Face match uses the CNN verifier and remains authoritative.
- TODO: integrate a real DL verification provider.
