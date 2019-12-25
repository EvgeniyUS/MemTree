# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models


class ElectroData(models.Model):
    date = models.DateTimeField(null=True, auto_now_add=True)
    dayRate = models.FloatField(null=True, blank=True)
    nightRate = models.FloatField(null=True, blank=True)
    dayE1 = models.IntegerField(null=True, blank=True)
    dayConsumption = models.IntegerField(null=True, blank=True)
    dayCost = models.FloatField(null=True, blank=True)
    nightE2 = models.IntegerField(null=True, blank=True)
    nightConsumption = models.IntegerField(null=True, blank=True)
    nightCost = models.FloatField(null=True, blank=True)
    totalCost = models.FloatField(null=True, blank=True)
    neighbors = models.IntegerField(null=True, blank=True)
    neighborsCost = models.FloatField(null=True, blank=True)
    us = models.IntegerField(null=True, blank=True)
    usCost = models.FloatField(null=True, blank=True)
    neCost = models.FloatField(null=True, blank=True)

    def __str__(self):
        return str(self.date)
