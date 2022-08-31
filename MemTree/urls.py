from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('items/', views.items, name='items'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('registration/', views.registration, name='registration'),
    path('delete-account/', views.delete_account, name='delete_account'),
    path('create/', views.create, name='create'),
    path('collapse/', views.collapse, name='collapse'),
    path('change-text/', views.change_text, name='change_text'),
    path('move/', views.move, name='move'),
    path('delete/', views.delete, name='delete'),
    path('user-help/', views.user_help, name='user_help'),
]
