from django.conf.urls import include
from django.urls import path
from django.contrib import admin
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('registration/', views.registration, name='registration'),
    path('delete-account/', views.delete_account, name='delete_account'),
    path('user-help/', views.user_help, name='user_help'),
    path('', include('item.urls')),
]
