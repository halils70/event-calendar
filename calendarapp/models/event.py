from datetime import datetime
from django.db import models
from django.urls import reverse

from calendarapp.models import EventAbstract
from accounts.models import User

class EventManager(models.Manager):
    """ Event manager """

    def get_all_events(self, user):
        events = Event.objects.filter(user=user, is_active=True, is_deleted=False)
        return events

    def get_running_events(self, user):
        running_events = Event.objects.filter(
            user=user,
            is_active=True,
            is_deleted=False,
            end_time__gte=datetime.now().date(),
            start_time__lte = datetime.now().date()
        ).order_by("start_time")
        return running_events
    
    def get_completed_events(self, user):
        completed_events = Event.objects.filter(
            user=user,
            is_active=True,
            is_deleted=False,
            end_time__lt=datetime.now().date(),
        )
        return completed_events
    
    def get_upcoming_events(self, user):
        upcoming_events = Event.objects.filter(
            user=user,
            is_active=True,
            is_deleted=False,
            start_time__gt=datetime.now().date(),
        )
        return upcoming_events

class Event(EventAbstract):
    """ Event model """
    class MedicineFrequency(models.TextChoices):
        ONCE = "Once", "Once"
        DAILY = "Daily", "Daily"
        WEEKLY = "Weekly", "Weekly"
        MONTHLY = "Monthly", "Monthly"
        YEARLY = "Yearly", "Yearly"
    class MedicineTakingType(models.TextChoices):
        BEFORE_FOOD = "Before Food", "Before Food"
        AFTER_FOOD = "After Food", "After Food"
        WITH_FOOD = "With Food", "With Food"
        EMPTY_STOMACH = "Empty Stomach", "Empty Stomach"
        ANYTIME = "Anytime", "Anytime"
    class MedicineUnit(models.TextChoices):
        MG = "mg", "mg"
        ML = "ml", "ml"
        UNITS = "units", "units"
        PILL = "pill", "pill"
        TABLET = "tablet", "tablet"
        CAPSULE = "capsule", "capsule"
        DROP = "drop", "drop"
        PUFF = "puff", "puff"
    class MedicineType(models.TextChoices):
        TABLET = "Tablet", "Tablet"
        CAPSULE = "Capsule", "Capsule"
        SYRUP = "Syrup", "Syrup"
        INJECTION = "Injection", "Injection"
        OINTMENT = "Ointment", "Ointment"
        CREAM = "Cream", "Cream"
        LOTION = "Lotion", "Lotion"
        INHALER = "Inhaler", "Inhaler"
        DROPS = "Drops", "Drops"
        PATCH = "Patch", "Patch"
        SUPPOSITORY = "Suppository", "Suppository"
        POWDER = "Powder", "Powder"
        GEL = "Gel", "Gel"
        SPRAY = "Spray", "Spray"
        OTHER = "Other", "Other"
    class MedicineReminderMethod(models.TextChoices):
        NOTIFICATION = "Notification", "Notification"
        EMAIL = "Email", "Email"
        SMS = "SMS", "SMS"
        CALL = "Call", "Call"
        OTHER = "Other", "Other"
    class MedicineDurationType(models.TextChoices):
        DAYS = "Days", "Days"
        WEEKS = "Weeks", "Weeks"
        MONTHS = "Months", "Months"
        UNTIL_FINISHED = "Until Finished", "Until Finished"
        LIFETIME = "Lifetime", "Lifetime"
    medicineFrequency = models.CharField(max_length=10, choices=MedicineFrequency.choices, default=MedicineFrequency.ONCE)
    medicineTakingType = models.CharField(max_length=20, choices=MedicineTakingType.choices, default=MedicineTakingType.ANYTIME)
    medicineUnit = models.CharField(max_length=10, choices=MedicineUnit.choices, default=MedicineUnit.PILL)
    medicineType = models.CharField(max_length=20, choices=MedicineType.choices, default=MedicineType.TABLET)
    medicineReminderMethod = models.CharField(max_length=15, choices=MedicineReminderMethod.choices, default=MedicineReminderMethod.NOTIFICATION)
    medicineDurationType = models.CharField(max_length=15, choices=MedicineDurationType.choices, default=MedicineDurationType.DAYS)
    medicineDosage = models.FloatField(default=1.0)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="events")
    title = models.CharField(max_length=200)
    description = models.TextField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    objects = EventManager()

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse("calendarapp:event-detail", args=(self.id,))

    @property
    def get_html_url(self):
        url = reverse("calendarapp:event-detail", args=(self.id,))
        return f'<a href="{url}"> {self.title} </a>'

class MeasurementLog(models.Model):
    """ Measurement log model """
    class measurementUnits(models.TextChoices):
        MG_DL = "mg/dL", "mg/dL" # Blood glucose
        MMOL_L = "mmol/L", "mmol/L"  # Blood glucose
        PERCENT = "%", "%" # HbA1c
        BPM = "bpm", "bpm" # Heart rate
        MM_HG = "mmHg", "mmHg" # Blood pressure
        CELSIUS = "Celsius", "Celsius" # Body temperature
        FAHRENHEIT = "Fahrenheit", "Fahrenheit" # Body temperature

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    measurement_time = models.DateTimeField(auto_now_add=True)
    mesaurement_value = models.FloatField()
    units = models.CharField(max_length=10, choices=measurementUnits.choices)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"MeasurementLog for {self.title} at {self.measurement_time}"