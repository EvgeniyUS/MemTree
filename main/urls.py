from django.conf.urls import url, include
from . import views

urlpatterns = [
    url(r'^$', views.home),
    url(r'^info$', views.info),
    url(r'^calc', include('calc.urls')),
    url(r'^gorynych', include('gorynych.urls')),
]


