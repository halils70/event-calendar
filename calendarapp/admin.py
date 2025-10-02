from django.contrib import admin
from calendarapp import models
from accounts.models import User


@admin.register(models.Event)
class EventAdmin(admin.ModelAdmin):
    model = models.Event
    list_display = [
        "id",
        "title",
        "user",
        "is_active",
        "is_deleted",
        "created_at",
        "updated_at",
    ]
    list_filter = ["is_active", "is_deleted"]
    search_fields = ["title"]


@admin.register(models.EventMember)
class EventMemberAdmin(admin.ModelAdmin):
    model = models.EventMember
    list_display = ["id", "event", "user", "created_at", "updated_at"]
    list_filter = ["event"]

class UserAdmin(admin.ModelAdmin):
    model = User
    list_display = ["id", "username", "email", "is_active", "is_staff", "created_at", "updated_at"]
    list_filter = ["is_active", "is_staff"]
    search_fields = ["username", "email"]
admin.site.register(User)


class MeasurementLogAdmin(admin.ModelAdmin):
    model = models.MeasurementLog
    list_display = ["id", "title", "user", "measurement_time", "measurement_value", 
                    "units", "notes", "created_at", "updated_at", "is_active", "is_deleted"]
    list_filter = ["title", "user", "measurement_time", "is_active", "is_deleted"]
    search_fields = ["title", "measurement_time"]
admin.site.register(models.MeasurementLog)