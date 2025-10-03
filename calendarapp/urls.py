from django.urls import path
from . import views

app_name = "calendarapp"

urlpatterns = [
    path("calender/", views.CalendarViewNew.as_view(), name="calendar"),
    path("calenders/", views.CalendarView.as_view(), name="calendars"),
    path('delete_event/<int:event_id>/', views.delete_event, name='delete_event'),
    path('next_week/<int:event_id>/', views.next_week, name='next_week'),
    path('next_day/<int:event_id>/', views.next_day, name='next_day'),
    path("event/new/", views.create_event, name="event_new"),
    path("event/edit/<int:pk>/", views.EventEdit.as_view(), name="event_edit"),
    path("event/<int:event_id>/details/", views.event_details, name="event-detail"),
    path(
        "add_eventmember/<int:event_id>", views.add_eventmember, name="add_eventmember"
    ),
    path(
        "event/<int:pk>/remove",
        views.EventMemberDeleteView.as_view(),
        name="remove_event",
    ),
    path("all-event-list/", views.AllEventsListView.as_view(), name="all_events"),
    path(
        "running-event-list/",
        views.RunningEventsListView.as_view(),
        name="running_events",
    ),
    path(
        "upcoming-event-list/",
        views.UpcomingEventsListView.as_view(),
        name="upcoming_events",
    ),
    path(
        "completed-event-list/",
        views.CompletedEventsListView.as_view(),
        name="completed_events",
    ),
        path(
        "measurement-log-list/",
        views.MeasurementLogListView.as_view(),
        name="measurement_log_list",
    ),
    
    path(
        "measurement-log/new/",
        views.MeasurementLogCreateView.as_view(),
        name="measurement_log_new",
    ),
    path(
        "measurement-log/edit/<int:pk>/",
        views.MeasurementLogUpdateView.as_view(),
        name="measurement_log_edit",
    ),
    path(
        "measurement-log/<int:pk>/remove",
        views.MeasurementLogDeleteView.as_view(),
        name="measurement_log_remove",
    ),
    path("help/", views.help_view, name="help"),
    path("about/", views.about_view, name="about"),
]
