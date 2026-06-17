import base64
import os
import time
import uuid

from django.conf import settings
from imagekitio import ImageKit


def get_imagekit_client():
    return ImageKit(private_key=settings.IMAGEKIT_PRIVATE_KEY)


def get_authentication_parameters():
    token = uuid.uuid4().hex
    expire = int(time.time()) + 20 * 60
    return get_imagekit_client().helper.get_authentication_parameters(token=token, expire=expire)


def upload_to_imagekit(base64_data, file_name=None, folder="/aerodrive/uploads"):
    """
    Uploads a browser data URL/base64 image to ImageKit and returns the hosted URL.
    Example return: https://ik.imagekit.io/aerodrive/cars/bmw.jpg
    """
    if not base64_data:
        return ""

    if settings.IMAGEKIT_PRIVATE_KEY == "your_private_key":
        safe_name = file_name or f"{uuid.uuid4().hex}.jpg"
        return f"{settings.IMAGEKIT_URL_ENDPOINT.rstrip('/')}{folder}/{safe_name}"

    encoded = base64_data.split(",", 1)[1] if "," in base64_data else base64_data
    base64.b64decode(encoded, validate=True)

    name = file_name or f"{uuid.uuid4().hex}.jpg"
    root, ext = os.path.splitext(name)
    if not ext:
        name = f"{root}.jpg"

    response = get_imagekit_client().files.upload(
        file=base64_data,
        file_name=name,
        folder=folder,
        use_unique_file_name=True,
    )
    return response.url


upload_data_url = upload_to_imagekit
