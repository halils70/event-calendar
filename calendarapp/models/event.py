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