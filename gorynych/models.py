# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models

class mainTreeDataBase(models.Model):
  name = models.CharField(max_length=100, null=True, blank=True)
  parent = models.ForeignKey('mainTreeDataBase', on_delete=models.CASCADE, null=True, blank=True)
  #parent = models.IntegerField(null=True, blank=True)

  def __str__(self):
    return str(self.id)+' - '+self.name
