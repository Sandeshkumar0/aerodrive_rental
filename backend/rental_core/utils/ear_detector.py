import random

def compute_ear(frame_b64):
    """
    Simulates computing the Eye Aspect Ratio (EAR) using facial landmarks.
    In a real app, this uses dlib shape predictor (68 landmarks).
    Normal EAR is > 0.25. Sleepy/closed is < 0.22.
    """
    # For simulation, we randomly drop EAR to trigger drowsiness alerts occasionally
    if random.random() < 0.05:
        return random.uniform(0.15, 0.21) # Drowsy
    return random.uniform(0.28, 0.35) # Awake
