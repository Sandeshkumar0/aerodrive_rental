from django.db import models
from django.contrib.auth.models import User

class Car(models.Model):
    TYPES = (
        ('SUV', 'SUV'),
        ('Sedan', 'Sedan'),
        ('Electric', 'Electric'),
        ('Hypercar', 'Hypercar')
    )
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    type = models.CharField(max_length=50, choices=TYPES)
    price_per_day = models.IntegerField()
    range_miles = models.IntegerField()
    horsepower = models.IntegerField()
    image_url = models.URLField()
    availability = models.BooleanField(default=True)
    features = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.make} {self.model}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    aadhaar_number = models.CharField(max_length=12, blank=True, null=True)
    aadhaar_last4 = models.CharField(max_length=4, blank=True, null=True)
    aadhaar_verified = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    face_embedding = models.TextField(blank=True, null=True) # Mock embedding string
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    profile_pic_url = models.URLField(blank=True, null=True)
    driver_license_url = models.URLField(blank=True, null=True)
    driver_selfie_url = models.URLField(blank=True, null=True)
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_expires_at = models.DateTimeField(blank=True, null=True)
    is_admin = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username

class Booking(models.Model):
    STATUS = (
        ('pending', 'pending'),
        ('reserved', 'reserved'),
        ('active', 'active'),
        ('completed', 'completed')
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    car = models.ForeignKey(Car, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    estimated_distance = models.IntegerField(default=100) # mock default
    total_cost = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_expires_at = models.DateTimeField(blank=True, null=True)
    access_granted = models.BooleanField(default=False)
    otp_verified = models.BooleanField(default=False)
    driver_license_url = models.URLField(blank=True, null=True)
    driver_selfie_url = models.URLField(blank=True, null=True)
    driver_reference_url = models.URLField(blank=True, null=True)

class SafetyLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    alert_type = models.CharField(max_length=100) # "Drowsiness", "Phone Detected", "Eyes Off Road"
    severity = models.CharField(max_length=20) # "WARNING" / "CRITICAL"
    frame_snapshot = models.TextField(blank=True, null=True) # Base64 frame
    
class AadhaarRecord(models.Model):
    # Mock Government Database
    aadhaar_number = models.CharField(max_length=12, unique=True)
    name = models.CharField(max_length=100)
    dob = models.DateField()
    face_image_b64 = models.TextField() # Mock target image

    def __str__(self):
        return self.name
