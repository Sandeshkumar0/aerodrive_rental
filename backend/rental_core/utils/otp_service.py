import random
import string

def generate_otp(length=6):
    """Generates a random 6-digit OTP."""
    return ''.join(random.choices(string.digits, k=length))

def send_mock_sms(phone_number, otp):
    """
    Simulates sending an SMS via Twilio or SNS.
    """
    print(f"[MOCK SMS] Sending OTP {otp} to {phone_number}")
    return True
