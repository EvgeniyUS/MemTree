# -*- coding: UTF-8 -*-

from django import forms


class CalcForm(forms.Form):
    dayRate = forms.FloatField(label=u"Тариф День", required=True)
    nightRate = forms.FloatField(label=u"Тариф Ночь", required=True)
    dayE1 = forms.IntegerField(label=u"Предыдущий показатель - День (E1)", required=True)
    dayNow = forms.IntegerField(label=u"День (E1)", required=True)
    nightE2 = forms.IntegerField(label=u"Предыдущий показатель - Ночь (E2)", required=True)
    nightNow = forms.IntegerField(label=u"Ночь (E2)", required=True)
    neighbors = forms.IntegerField(label=u"Предыдущий показатель - Соседи", required=True)
    neighborsNow = forms.IntegerField(label=u"Соседи", required=True)
    us = forms.IntegerField(label=u"Предыдущий показатель - Мы", required=True)
    usNow = forms.IntegerField(label=u"Мы", required=True)

    def __init__(self, *args, **kwargs):
        super(CalcForm, self).__init__(*args, **kwargs)
