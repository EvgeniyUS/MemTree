from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^$', views.form),
    url(r'^cont$', views.cont),
    url(r'^calc$', views.calc),
]

