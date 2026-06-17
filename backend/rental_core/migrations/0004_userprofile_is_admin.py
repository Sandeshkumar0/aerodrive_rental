from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("rental_core", "0003_booking_driver_license_url_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="is_admin",
            field=models.BooleanField(default=False),
        ),
    ]
