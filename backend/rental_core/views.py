import json
import uuid
import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.utils import timezone
from pymongo import MongoClient
from pymongo import ReturnDocument
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from .models import UserProfile
from .utils import cnn_verify, ear_detector, phone_detector, otp_service
from .utils.imagekit_service import get_authentication_parameters, upload_to_imagekit

import os
# MongoDB connection
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URI)
db = client['car-rent']
cars_collection = db['cars']
bookings_collection = db['bookings']
safety_logs_collection = db['safety_logs']
aadhaar_collection = db['aadhaar_records']
users_collection = db['users']

def _json_body(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return None

def _public_user(user):
    if isinstance(user, User):
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return {
            "id": str(user.id),
            "name": user.get_full_name() or user.username,
            "email": user.email,
            "phone": profile.phone_number,
            "aadhaar_last4": profile.aadhaar_last4,
            "is_verified": profile.is_verified,
            "profile_pic_url": profile.profile_pic_url,
            "is_admin": profile.is_admin or user.is_staff or user.is_superuser,
        }

    return {
        "id": user.get("id"),
        "name": user.get("name"),
        "email": user.get("email"),
    }

def _send_booking_otp(email, otp, booking_id):
    if not email:
        return False

    send_mail(
        subject="AeroDrive - Your Car Access OTP",
        message=f"Your OTP to unlock booking {booking_id} is: {otp}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=True,
    )
    return True

def _auth_user(request):
    auth_result = JWTAuthentication().authenticate(request)
    return auth_result[0] if auth_result else None

def _require_admin(request):
    user = _auth_user(request)
    if not user:
        return None, JsonResponse({"error": "Authentication required"}, status=401)
    profile, _ = UserProfile.objects.get_or_create(user=user)
    if not (profile.is_admin or user.is_staff or user.is_superuser):
        return None, JsonResponse({"error": "Admin access required"}, status=403)
    return user, None

def _tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }

def _parse_expiry(value):
    if not value:
        return None
    parsed = datetime.datetime.fromisoformat(value)
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
    return parsed

def _booking_otp_is_valid(booking, otp):
    expected_otp = booking.get("booking_otp") or booking.get("otp_code")
    expires_at = _parse_expiry(booking.get("booking_otp_expires_at") or booking.get("otp_expires_at"))
    if not expected_otp or str(otp) != str(expected_otp):
        return False, "Invalid OTP"
    if expires_at and expires_at < timezone.now():
        return False, "OTP expired"
    return True, ""

def _release_car_for_booking(booking):
    if not booking:
        return
    car_id = booking.get("car_id")
    booking_id = booking.get("id")
    cars_collection.update_one(
        {"id": car_id, "reserved_booking": booking_id},
        {"$set": {"availability": True}, "$unset": {"reserved_by": "", "reserved_booking": ""}},
    )

@csrf_exempt
def register_user(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    phone = (data.get('phone') or '').strip()
    password = data.get('password') or ''

    if not name or not email or not phone or len(password) < 6:
        return JsonResponse({"error": "Name, email, phone and 6+ character password are required"}, status=400)

    if User.objects.filter(email=email).exists():
        return JsonResponse({"error": "Email already registered"}, status=400)

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=name,
    )
    UserProfile.objects.create(user=user, phone_number=phone)
    tokens = _tokens_for_user(user)
    return JsonResponse({"success": True, "user": _public_user(user), **tokens})

@csrf_exempt
def login_user(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    user = authenticate(username=email, password=password)

    if not user:
        return JsonResponse({"error": "Invalid email or password"}, status=400)

    tokens = _tokens_for_user(user)
    return JsonResponse({"success": True, "user": _public_user(user), **tokens})

@csrf_exempt
def logout_user(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = _json_body(request)
    refresh = (data or {}).get("refresh")
    if refresh:
        try:
            RefreshToken(refresh).blacklist()
        except Exception:
            pass
    return JsonResponse({"success": True})

def current_user(request):
    user = _auth_user(request)
    if not user:
        return JsonResponse({"error": "Authentication required"}, status=401)
    return JsonResponse({"user": _public_user(user)})

def imagekit_auth(request):
    return JsonResponse({
        **get_authentication_parameters(),
        "publicKey": settings.IMAGEKIT_PUBLIC_KEY,
        "urlEndpoint": settings.IMAGEKIT_URL_ENDPOINT,
    })

@csrf_exempt
def upload_image(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    user = _auth_user(request)
    if not user:
        return JsonResponse({"error": "Authentication required"}, status=401)

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    image_b64 = data.get("image_b64")
    folder = data.get("folder") or "/aerodrive/uploads"
    file_name = data.get("file_name") or f"{uuid.uuid4().hex}.jpg"
    url = upload_to_imagekit(image_b64, file_name=file_name, folder=folder)
    return JsonResponse({"url": url})

def get_cars(request):
    cars = list(cars_collection.find({}, {'_id': 0}))
    for c in cars:
        # Generate ImageKit URL manually
        ik_url = c.get('image_url', '')
        if ik_url and not ik_url.startswith('http'):
             endpoint = getattr(settings, 'IMAGEKIT_URL_ENDPOINT', '')
             if endpoint and not endpoint.endswith('/'): endpoint += '/'
             c['image_url'] = endpoint + ik_url
    return JsonResponse(cars, safe=False)

@csrf_exempt
def book_car(request):
    """Initiates booking and sends OTP for confirmation"""
    if request.method == 'POST':
        user = _auth_user(request)
        if not user:
            return JsonResponse({"error": "Authentication required"}, status=401)

        data = _json_body(request)
        if data is None:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        user_id = str(user.id)
        user_email = user.email
        car_id = data.get('car_id')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        distance = int(data.get('distance', 100))

        if not start_date or not end_date:
            return JsonResponse({"error": "Start date and end date are required"}, status=400)
        
        car = cars_collection.find_one({'id': car_id})
        if not car:
            return JsonResponse({"error": "Car not found"}, status=404)

        if not car.get('availability', True):
            return JsonResponse({"error": "Car is not available"}, status=409)
        
        # Calculate price based on days and distance
        d1 = datetime.datetime.strptime(start_date, '%Y-%m-%d').date()
        d2 = datetime.datetime.strptime(end_date, '%Y-%m-%d').date()
        days = (d2 - d1).days or 1
        
        total_cost = (car.get('price_per_day', 0) * days) + (distance * 10) 
        
        booking_id = str(uuid.uuid4())
        otp = otp_service.generate_otp()
        otp_expires_at = timezone.now() + datetime.timedelta(hours=24)

        booking = {
            "id": booking_id,
            "user_id": user_id,
            "user_email": user_email,
            "car_id": car_id,
            "car_make": car['make'],
            "car_model": car['model'],
            "car_image": car['image_url'],
            "start_date": start_date,
            "end_date": end_date,
            "estimated_distance": distance,
            "total_cost": total_cost,
            "status": "pending",
            "access_granted": False,
            "booking_otp": otp,
            "otp_code": otp,
            "booking_otp_expires_at": otp_expires_at.isoformat(),
            "otp_expires_at": otp_expires_at.isoformat(),
            "otp_verified": False,
            "identity_verified": False,
            "driver_license_url": "",
            "driver_selfie_url": "",
        }

        reserved_car = cars_collection.find_one_and_update(
            {"id": car_id, "availability": True},
            {"$set": {"availability": False, "reserved_by": user_id, "reserved_booking": booking_id}},
            return_document=ReturnDocument.AFTER,
        )

        if not reserved_car:
            return JsonResponse({"error": "Car just got booked by someone else"}, status=409)

        bookings_collection.insert_one(booking)
        
        otp_service.send_mock_sms("+91 98765 43210", otp)
        _send_booking_otp(user_email, otp, booking_id)
        
        return JsonResponse({
            "booking_id": booking_id,
            "total_cost": total_cost,
            "days": days,
            "distance": distance,
            "message": "Booking Confirmed! Check your email for OTP",
            "otp_sent_to": user_email
        })

@csrf_exempt
def verify_otp(request):
    """Verifies OTP and confirms the reservation"""
    if request.method == 'POST':
        data = _json_body(request)
        if data is None:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        booking_id = data.get('booking_id')
        otp = data.get('otp')
        action = data.get('action', 'confirm_booking') 
        
        booking = bookings_collection.find_one({"id": booking_id})
        if not booking:
            return JsonResponse({"error": "Booking not found"}, status=404)

        valid, error = _booking_otp_is_valid(booking, otp)
        if not valid:
            if error == "OTP expired":
                bookings_collection.update_one(
                    {"id": booking_id},
                    {"$set": {"status": "canceled", "otp_verified": False}},
                )
                _release_car_for_booking(booking)
            return JsonResponse({"error": error}, status=400)
        
        if action == 'confirm_booking':
            bookings_collection.update_one({"id": booking_id}, {"$set": {"otp_verified": True}})
            return JsonResponse({
                "success": True,
                "message": "Ride Confirmed and Billed.",
                "bill": booking.get('total_cost')
            })
        elif action == 'unlock':
            bookings_collection.update_one({"id": booking_id}, {"$set": {"access_granted": True, "otp_verified": True}})
            return JsonResponse({
                "access_granted": True, 
                "car_unlock_token": f"AE-{uuid.uuid4().hex[:4].upper()}-XK"
            })

def get_reservations(request, user_id):
    bookings = list(bookings_collection.find({"user_id": str(user_id)}, {'_id': 0}).sort('_id', -1))
    return JsonResponse(bookings, safe=False)

def get_booking(request, booking_id):
    user = _auth_user(request)
    if not user:
        return JsonResponse({"error": "Authentication required"}, status=401)

    booking = bookings_collection.find_one({"id": booking_id, "user_id": str(user.id)}, {'_id': 0})
    if not booking:
        return JsonResponse({"error": "Booking not found"}, status=404)
    return JsonResponse(booking)

def admin_bookings(request):
    _, error = _require_admin(request)
    if error:
        return error

    bookings = list(bookings_collection.find({}, {"_id": 0}).sort('start_date', -1))
    enriched = []
    for booking in bookings:
        user_info = None
        try:
            user_obj = User.objects.get(id=int(booking.get("user_id")))
            profile, _ = UserProfile.objects.get_or_create(user=user_obj)
            user_info = {
                "id": str(user_obj.id),
                "name": user_obj.get_full_name() or user_obj.username,
                "email": user_obj.email,
                "phone": profile.phone_number,
                "is_verified": profile.is_verified,
                "profile_pic_url": profile.profile_pic_url,
                "driver_license_url": profile.driver_license_url,
                "driver_selfie_url": profile.driver_selfie_url,
            }
        except Exception:
            user_info = {
                "id": booking.get("user_id"),
                "email": booking.get("user_email"),
            }

        booking["user"] = user_info
        enriched.append(booking)

    return JsonResponse(enriched, safe=False)

@csrf_exempt
def admin_update_booking(request, booking_id):
    if request.method not in ("POST", "PATCH"):
        return JsonResponse({"error": "Method not allowed"}, status=405)

    _, error = _require_admin(request)
    if error:
        return error

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    booking = bookings_collection.find_one({"id": booking_id})
    if not booking:
        return JsonResponse({"error": "Booking not found"}, status=404)

    updates = {}
    if "status" in data:
        updates["status"] = data.get("status")
    if "damage_reported" in data:
        updates["damage_reported"] = bool(data.get("damage_reported"))
    if "damage_notes" in data:
        updates["damage_notes"] = (data.get("damage_notes") or "").strip()
    if "damage_images" in data:
        updates["damage_images"] = data.get("damage_images") or []
    if "admin_notes" in data:
        updates["admin_notes"] = (data.get("admin_notes") or "").strip()
    if "servicing" in data:
        updates["servicing"] = bool(data.get("servicing"))

    if updates:
        bookings_collection.update_one({"id": booking_id}, {"$set": updates})

    if "car_servicing" in data or "car_availability" in data:
        car_updates = {}
        if "car_servicing" in data:
            car_updates["servicing"] = bool(data.get("car_servicing"))
            if car_updates["servicing"]:
                car_updates["availability"] = False
        if "car_availability" in data:
            car_updates["availability"] = bool(data.get("car_availability"))

        if car_updates:
            car_id = booking.get("car_id")
            cars_collection.update_one({"id": car_id}, {"$set": car_updates})

    return JsonResponse({"success": True})

def admin_cars(request):
    _, error = _require_admin(request)
    if error:
        return error
    cars = list(cars_collection.find({}, {"_id": 0}))
    return JsonResponse(cars, safe=False)

@csrf_exempt
def admin_update_car(request, car_id):
    if request.method not in ("POST", "PATCH"):
        return JsonResponse({"error": "Method not allowed"}, status=405)

    _, error = _require_admin(request)
    if error:
        return error

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    updates = {}
    if "availability" in data:
        updates["availability"] = bool(data.get("availability"))
    if "servicing" in data:
        updates["servicing"] = bool(data.get("servicing"))
        if updates["servicing"]:
            updates["availability"] = False

    if not updates:
        return JsonResponse({"error": "No updates provided"}, status=400)

    cars_collection.update_one({"id": car_id}, {"$set": updates})
    return JsonResponse({"success": True})

def admin_damage_reports(request):
    _, error = _require_admin(request)
    if error:
        return error
    reports = list(bookings_collection.find({"damage_reported": True}, {"_id": 0}).sort('start_date', -1))
    return JsonResponse(reports, safe=False)

@csrf_exempt
def verify_aadhaar(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        booking_id = data.get('booking_id')
        aadhaar_number = data.get('aadhaar_number')
        selfie_b64 = data.get('selfie_b64')
        
        record = aadhaar_collection.find_one({"aadhaar_number": aadhaar_number})
        if record:
            score = cnn_verify.siamese_cosine_match(record.get('face_image_b64'), selfie_b64)
            if score > 0.88:
                if booking_id:
                    bookings_collection.update_one({"id": booking_id}, {"$set": {"status": "active"}})
                return JsonResponse({
                    "matched": True,
                    "confidence": round(score * 100, 2),
                    "name": record.get('name'),
                    "aadhaar_last4": aadhaar_number[-4:]
                })
            else:
                return JsonResponse({"matched": False, "confidence": round(score * 100, 2)})
        return JsonResponse({"matched": False, "confidence": 0, "error": "Aadhaar not found"})

@csrf_exempt
def verify_documents(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    user = _auth_user(request)
    if not user:
        return JsonResponse({"error": "Authentication required"}, status=401)

    data = _json_body(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    booking_id = data.get("booking_id")
    license_url = data.get("license_url")
    selfie_url = data.get("selfie_url")
    otp = data.get("otp")

    booking = bookings_collection.find_one({"id": booking_id, "user_id": str(user.id)})
    if not booking:
        return JsonResponse({"error": "Booking not found"}, status=404)

    valid, error = _booking_otp_is_valid(booking, otp)
    if not valid:
        return JsonResponse({"verified": False, "error": error}, status=400)

    score = cnn_verify.siamese_cosine_match(license_url, selfie_url)
    confidence = round(score * 100, 2)
    verified = score > 0.88

    if verified:
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.driver_license_url = license_url
        profile.driver_selfie_url = selfie_url
        profile.profile_pic_url = selfie_url
        profile.is_verified = True
        profile.save()

        bookings_collection.update_one(
            {"id": booking_id},
            {"$set": {
                "status": "active",
                "access_granted": True,
                "otp_verified": True,
                "identity_verified": True,
                "driver_license_url": license_url,
                "driver_selfie_url": selfie_url,
                "driver_reference_url": selfie_url,
            }}
        )

    return JsonResponse({
        "verified": verified,
        "confidence": confidence,
        "access_granted": verified,
    })

@csrf_exempt
def send_otp(request):
    if request.method == 'POST':
        otp = otp_service.generate_otp()
        otp_service.send_mock_sms("+91 98765 43210", otp)
        return JsonResponse({"sent": True, "masked_phone": "+91 XXXXX X7832"})

@csrf_exempt
def end_ride_otp(request):
    if request.method == 'POST':
        data = _json_body(request)
        if data is None:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        booking_id = data.get('booking_id')
        otp = otp_service.generate_otp()
        booking = bookings_collection.find_one({"id": booking_id})
        user_email = (booking or {}).get("user_email")
        bookings_collection.update_one(
            {"id": booking_id},
            {"$set": {
                "end_ride_otp": otp,
                "end_ride_otp_expires_at": (timezone.now() + datetime.timedelta(minutes=10)).isoformat()
            }}
        )
        otp_service.send_mock_sms("+91 98765 43210", otp)
        _send_booking_otp(user_email, otp, booking_id)
        return JsonResponse({"sent": True, "message": "OTP sent to confirm ride end"})

@csrf_exempt
def verify_end_ride(request):
    if request.method == 'POST':
        data = _json_body(request)
        if data is None:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        booking_id = data.get('booking_id')
        otp = data.get('otp')
        booking = bookings_collection.find_one({"id": booking_id})
        if not booking:
            return JsonResponse({"error": "Booking not found"}, status=404)
        if booking.get("end_ride_otp") and str(otp) != str(booking.get("end_ride_otp")):
            return JsonResponse({"error": "Invalid OTP"}, status=400)
        
        bookings_collection.update_one({"id": booking_id}, {"$set": {"status": "completed"}})
        _release_car_for_booking(booking)
        return JsonResponse({"success": True, "message": "Ride completed successfully"})

@csrf_exempt
def cancel_booking(request, booking_id):
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    user = _auth_user(request)
    if not user:
        return JsonResponse({"error": "Authentication required"}, status=401)

    booking = bookings_collection.find_one({"id": booking_id, "user_id": str(user.id)})
    if not booking:
        return JsonResponse({"error": "Booking not found"}, status=404)

    if booking.get("status") in {"completed", "canceled"}:
        return JsonResponse({"error": "Booking already closed"}, status=400)

    bookings_collection.update_one(
        {"id": booking_id},
        {"$set": {"status": "canceled", "otp_verified": False}},
    )
    _release_car_for_booking(booking)
    return JsonResponse({"success": True, "message": "Booking canceled"})

consecutive_low_frames = 0

@csrf_exempt
def process_drowsiness(request):
    global consecutive_low_frames
    if request.method == 'POST':
        data = json.loads(request.body)
        frame_b64 = data.get('frame_b64')
        user_id = data.get('user_id', 'mockuser_123')
        
        ear = ear_detector.compute_ear(frame_b64)
        
        if ear < 0.22:
            consecutive_low_frames += 1
        else:
            consecutive_low_frames = 0
            
        if consecutive_low_frames >= 3:
            safety_logs_collection.insert_one({"user_id": user_id, "timestamp": datetime.datetime.now().isoformat(), "alert_type": "Drowsiness", "severity": "CRITICAL"})
            return JsonResponse({
                "drowsy": True, 
                "ear": round(ear, 2), 
                "trigger": "BUZZER_ACTIVATE"
            })
        elif consecutive_low_frames > 0:
             safety_logs_collection.insert_one({"user_id": user_id, "timestamp": datetime.datetime.now().isoformat(), "alert_type": "Eye Closure", "severity": "WARNING"})
             return JsonResponse({
                "drowsy": True, 
                "ear": round(ear, 2), 
                "trigger": "WARNING"
            })
        
        return JsonResponse({
            "drowsy": False, 
            "ear": round(ear, 2), 
            "consecutive_low_frames": consecutive_low_frames
        })

@csrf_exempt
def process_phone(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        frame_b64 = data.get('frame_b64')
        user_id = data.get('user_id', 'mockuser_123')
        
        confidence = phone_detector.detect_phone(frame_b64)
        
        if confidence > 0.75:
            safety_logs_collection.insert_one({"user_id": user_id, "timestamp": datetime.datetime.now().isoformat(), "alert_type": "Phone Detected", "severity": "CRITICAL"})
            return JsonResponse({
                "phone_detected": True, 
                "confidence": round(confidence, 2), 
                "trigger": "BUZZER_ACTIVATE"
            })
            
        return JsonResponse({"phone_detected": False, "confidence": round(confidence, 2)})

def safety_logs(request, user_id):
    logs = list(safety_logs_collection.find({"user_id": str(user_id)}, {'_id': 0}).sort('timestamp', -1).limit(50))
    return JsonResponse(logs, safe=False)

def get_all_safety_logs(request):
    _, error = _require_admin(request)
    if error:
        return error
    logs = list(safety_logs_collection.find({}, {'_id': 0}).sort('timestamp', -1).limit(100))
    return JsonResponse(logs, safe=False)
