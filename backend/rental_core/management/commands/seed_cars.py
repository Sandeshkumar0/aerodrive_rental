import os
from django.core.management.base import BaseCommand
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

class Command(BaseCommand):
    help = 'Seeds MongoDB with initial car fleet and mock Aadhaar data'

    def handle(self, *args, **kwargs):
        MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
        client = MongoClient(MONGO_URI)
        db = client['car-rent']
        
        # Clear existing
        db.cars.delete_many({})
        db.aadhaar_records.delete_many({})
        
        cars_data = [
            {
                "id": 1,
                "make": "Tesla", "model": "Model S Plaid", "type": "Electric Sedan",
                "price_per_day": 199, "range_miles": 396, "horsepower": 1020,
                "image_url": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                "availability": True,
                "features": "Autopilot, Bio-Weapon Defense Mode, 17-inch Cinematic Display"
            },
            {
                "id": 2,
                "make": "Porsche", "model": "Taycan Turbo S", "type": "Electric Sports",
                "price_per_day": 249, "range_miles": 278, "horsepower": 750,
                "image_url": "https://images.unsplash.com/photo-1503376760367-1b072464731c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                "availability": True,
                "features": "800-volt Architecture, Launch Control, Burmester 3D Surround"
            },
            {
                "id": 3,
                "make": "Audi", "model": "e-tron GT", "type": "Electric Grand Tourer",
                "price_per_day": 189, "range_miles": 238, "horsepower": 522,
                "image_url": "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                "availability": True,
                "features": "Quattro All-Wheel Drive, Matrix LED, Panoramic Glass Roof"
            },
            {
                "id": 4,
                "make": "Mercedes-Benz", "model": "EQS 580", "type": "Electric Luxury",
                "price_per_day": 220, "range_miles": 340, "horsepower": 516,
                "image_url": "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                "availability": True,
                "features": "MBUX Hyperscreen, Rear-Axle Steering, Energizing Air Control"
            },
            {
                "id": 5,
                "make": "BMW", "model": "i4 M50", "type": "Electric Gran Coupe",
                "price_per_day": 150, "range_miles": 270, "horsepower": 536,
                "image_url": "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                "availability": True,
                "features": "Curved Display, Adaptive M Suspension, IconicSounds Electric"
            },
            {
                "id": 6,
                "make": "Lucid", "model": "Air Dream Edition", "type": "Electric Luxury",
                "price_per_day": 280, "range_miles": 520, "horsepower": 1111,
                "image_url": "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                "availability": True,
                "features": "Glass Canopy, Surreal Sound Pro, DreamDrive Pro"
            },
            {
                "id": 7,
                "make": "Rivian", "model": "R1T", "type": "Electric Truck",
                "price_per_day": 170, "range_miles": 314, "horsepower": 835,
                "image_url": "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                "availability": True,
                "features": "Gear Tunnel, Camp Kitchen, Quad-Motor AWD"
            },
            {
                "id": 8,
                "make": "Polestar", "model": "3", "type": "Electric SUV",
                "price_per_day": 160, "range_miles": 300, "horsepower": 517,
                "image_url": "https://images.unsplash.com/photo-1620392686861-55bb2436d932?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                "availability": True,
                "features": "LIDAR, Bowers & Wilkins, Animal Welfare Leather"
            },
            {
                "id": 9,
                "make": "Ford", "model": "Mustang Mach-E GT", "type": "Electric Crossover",
                "price_per_day": 130, "range_miles": 270, "horsepower": 480,
                "image_url": "https://images.unsplash.com/photo-1611016186353-9af58c69a533?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                "availability": True,
                "features": "BlueCruise, MagneRide, B&O Sound System"
            }
        ]
        
        db.cars.insert_many(cars_data)
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(cars_data)} cars in MongoDB.'))
        
        # Seed Aadhaar Mock Data
        aadhaar_data = [
            {"aadhaar_number": "123456789012", "name": "Arjun Mehta", "face_image_b64": "MOCK_BASE64_ARJUN_FACE_FEATURES"},
            {"aadhaar_number": "987654321098", "name": "Priya Sharma", "face_image_b64": "MOCK_BASE64_PRIYA_FACE_FEATURES"},
            {"aadhaar_number": "111122223333", "name": "Rohan Kumar", "face_image_b64": "MOCK_BASE64_ROHAN_FACE_FEATURES"}
        ]
        db.aadhaar_records.insert_many(aadhaar_data)
        self.stdout.write(self.style.SUCCESS('Successfully seeded Mock Aadhaar Records in MongoDB.'))
