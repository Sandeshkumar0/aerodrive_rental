import random

def detect_phone(frame_b64):
    """
    Simulates a YOLOv8 object detection model for 'cell phone' class.
    Returns confidence score of phone detection.
    """
    # For simulation, occasionally detect a phone
    if random.random() < 0.02:
        return random.uniform(0.80, 0.95) # Phone detected
    return random.uniform(0.0, 0.2) # No phone
