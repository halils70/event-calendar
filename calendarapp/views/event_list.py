from django.views.generic import ListView
from calendarapp.models import Event, MeasurementLog
from django.shortcuts import redirect
from django.views.generic.edit import CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy

class AllEventsListView(ListView):
    """ All event list views """

    template_name = "calendarapp/events_list.html"
    model = Event

    def get_queryset(self):
        return Event.objects.get_all_events(user=self.request.user)

class RunningEventsListView(ListView):
    """ Running events list view """

    template_name = "calendarapp/events_list.html"
    model = Event

    def get_queryset(self):
        return Event.objects.get_running_events(user=self.request.user)

class UpcomingEventsListView(ListView):
    """ Upcoming events list view """

    template_name = "calendarapp/events_list.html"
    model = Event

    def get_queryset(self):
        return Event.objects.get_upcoming_events(user=self.request.user)
    
class CompletedEventsListView(ListView):
    """ Completed events list view """

    template_name = "calendarapp/events_list.html"
    model = Event

    def get_queryset(self):
        return Event.objects.get_completed_events(user=self.request.user)
    
class MeasurementLogListView(ListView):
    """ Measurement log list view """

    template_name = "calendarapp/measurement_log_list.html"
    model = MeasurementLog
    
    def get_queryset(self):
        logList = MeasurementLog.objects.filter(
            user=self.request.user,
            is_active=True,
            is_deleted=False,
            ).order_by('-measurement_time')
        return logList
    
class MeasurementLogCreateView(CreateView):
    """ Create measurement log view """

    model = MeasurementLog
    fields = ['measurement_time', 'weight', 'body_fat_percentage', 'muscle_mass', 'notes']  
    template_name = "calendarapp/measurement_log_form.html"
    success_url = reverse_lazy("calendarapp:measurement_log_list")

class MeasurementLogUpdateView(UpdateView):
    """ Update measurement log view """

    model = MeasurementLog
    fields = ['title', 'mesaurement_value', 'notes']  
    template_name = "calendarapp/measurement_log_form.html"
    success_url = reverse_lazy("calendarapp:measurement_log_list")

class MeasurementLogDeleteView(DeleteView):
    """ Delete measurement log view """

    model = MeasurementLog
    template_name = "calendarapp/measurement_log_confirm_delete.html"
    success_url = reverse_lazy("calendarapp:measurement_log_list")



