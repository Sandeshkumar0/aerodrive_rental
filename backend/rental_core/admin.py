from django.contrib import admin

from .models import AadhaarRecord, Booking, Car, SafetyLog, UserProfile


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
	list_display = ("make", "model", "type", "availability")
	search_fields = ("make", "model", "type")


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
	list_display = ("user", "car", "start_date", "end_date", "status")
	search_fields = ("user__username", "user__email", "car__make", "car__model", "status")


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
	list_display = ("user", "phone_number", "is_verified", "is_admin")
	search_fields = ("user__username", "user__email", "phone_number")


@admin.register(SafetyLog)
class SafetyLogAdmin(admin.ModelAdmin):
	list_display = ("user", "timestamp", "alert_type", "severity")
	search_fields = ("user__username", "alert_type", "severity")


@admin.register(AadhaarRecord)
class AadhaarRecordAdmin(admin.ModelAdmin):
	list_display = ("aadhaar_number", "name", "dob")
	search_fields = ("aadhaar_number", "name")
