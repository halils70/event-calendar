from django.forms import ModelForm, DateInput
from calendarapp.models import Event, EventMember, MeasurementLog
from django import forms


class EventForm(ModelForm):
    class Meta:
        model = Event
        fields = [
                "title", "description", "medicineFrequency", "medicineTakingType", "medicineUnit", 
                  "medicineType", "medicineReminderMethod", "medicineDurationType", "medicineDosage",
                  "start_time", "end_time"
                  ]
        # datetime-local is a HTML5 input type
        widgets = {
            "title": forms.TextInput(
                attrs={"class": "form-control", "placeholder": "Enter event title"}
            ),
            "description": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "placeholder": "Enter event description",
                }
            ),
            "start_time": DateInput(
                attrs={"type": "datetime-local", "class": "form-control"},
                format="%Y-%m-%dT%H:%M",
            ),
            "end_time": DateInput(
                attrs={"type": "datetime-local", "class": "form-control"},
                format="%Y-%m-%dT%H:%M",
            ),
            "medicineFrequency": forms.Select(attrs={"class": "form-control"}),
            "medicineTakingType": forms.Select(attrs={"class": "form-control"}),
            "medicineUnit": forms.Select(attrs={"class": "form-control"}),
            "medicineType": forms.Select(attrs={"class": "form-control"}),
            "medicineReminderMethod": forms.Select(attrs={"class": "form-control"}),
            "medicineDurationType": forms.Select(attrs={"class": "form-control"}),
            "medicineDosage": forms.TextInput(
                attrs={"class": "form-control", "placeholder": "Enter event title"}
            ),
        }
        exclude = ["user"]

    def __init__(self, *args, **kwargs):
        super(EventForm, self).__init__(*args, **kwargs)
        # input_formats to parse HTML5 datetime-local input to datetime field
        self.fields["start_time"].input_formats = ("%Y-%m-%dT%H:%M",)
        self.fields["end_time"].input_formats = ("%Y-%m-%dT%H:%M",)

class AddMemberForm(forms.ModelForm):
    class Meta:
        model = EventMember
        fields = ["user"]

class MeassurementlogForm(ModelForm):
    model = MeasurementLog
    fields = [
        "title",
        "user",
        "measurement_time",
        "mesaurement_value",
        "units",
        "notes",
    ]
