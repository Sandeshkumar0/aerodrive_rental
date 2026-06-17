import random

def siamese_cosine_match(embedding_1_b64, embedding_2_b64):
    """
    Simulates a Siamese CNN computing cosine distance between two 128-d face embeddings.
    In a real app, this would use dlib or OpenCV's FaceRecognizer.
    Returns a float between 0.0 and 1.0 representing confidence.
    """
    # For simulation, return a high confidence > 0.88 if both inputs exist
    if embedding_1_b64 and embedding_2_b64:
        return random.uniform(0.92, 0.98)
    return random.uniform(0.10, 0.40)
