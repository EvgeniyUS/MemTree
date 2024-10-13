from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('create/', views.create, name='create'),
    path('collapse/', views.collapse, name='collapse'),
    path('change-text/', views.change_text, name='change_text'),
    path('move/', views.move, name='move'),
    path('delete/', views.delete, name='delete'),
]
