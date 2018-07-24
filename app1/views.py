# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.http import HttpResponse

from app1.models import ElectroData
from app1.forms import CalcForm

from django.shortcuts import render#, render_to_response

def form(request):
  return render(request, 'app1/homePage.html')

def cont(request):
  return render(request, 'app1/cont.html', {'values':['л/с: 0660096']})

def calc(request):
  def calculation(values):
    values['dayConsumption'] = int(values["dayNow"])-int(values["dayE1"])
    values['dayCost'] = values["dayConsumption"]*float(values["dayRate"])
    values['nightConsumption'] = int(values["nightNow"])-int(values["nightE2"])
    values['nightCost'] = values["nightConsumption"]*float(values["nightRate"])
    values['totalCost'] = values["nightCost"] + values["dayCost"]
    dayToNight = float(values["dayConsumption"]) / values["nightConsumption"]
    neighborsDay = (int(values["neighborsNow"])-int(values["neighbors"]))*dayToNight/(1+dayToNight)
    neighborsNight = (int(values["neighborsNow"])-int(values["neighbors"]))-neighborsDay
    usDay = (int(values["usNow"])-int(values["us"]))*dayToNight/(1+dayToNight)
    usNight = (int(values["usNow"])-int(values["us"]))-usDay
    commonDay = values["dayConsumption"]-neighborsDay-usDay
    commonNight = values["nightConsumption"]-neighborsNight-usNight
    commonCost = (commonDay*float(values["dayRate"])+commonNight*float(values["nightRate"]))/3
    values['neighborsCost'] = round(neighborsDay*float(values["dayRate"])+neighborsNight*float(values["nightRate"])+commonCost, 2)
    values['usCost'] = round(usDay*float(values["dayRate"])+usNight*float(values["nightRate"])+commonCost, 2)
    values["neCost"] = round(commonCost, 2)
    values["dayE1"] = values["dayNow"]
    values["nightE2"] = values["nightNow"]
    values["neighbors"] = values["neighborsNow"]
    values["us"] = values["usNow"]
    del values['csrfmiddlewaretoken']
    del values['dayNow']
    del values['nightNow']
    del values['neighborsNow']
    del values['usNow']
    return values
  if request.method == "POST":
    values = request.POST.dict()
    if values:
      if int(values['dayE1']) < int(values['dayNow']) and int(values['nightE2']) < int(values['nightNow']) and int(values['neighbors']) < int(values['neighborsNow']) and int(values['us']) < int(values['usNow']):
        values = calculation(values)
        ElectroData.objects.create(**values)
        objects = ElectroData.objects.all().order_by("date").reverse()
        calcForm = CalcForm(initial=ElectroData.objects.last().__dict__)
        context = {'object_list':objects, 'form': calcForm}
        return render(request, 'app1/calc.html', context)
      else:
        return render(request, 'app1/error.html')
        #return HttpResponse("<h2>Ошибка данных: текущие показатели не могут быть меньше предыдущих.</h2>")
        #return render_to_response('app1/msg.html', {'message':'Ошибка данных: текущие показатели не могут быть меньше предыдущих.'})
  else:
    objects = ElectroData.objects.all().order_by("date").reverse()
    calcForm = CalcForm(initial=ElectroData.objects.last().__dict__)
    context = {'object_list':objects, 'form': calcForm}
    return render(request, 'app1/calc.html', context)

