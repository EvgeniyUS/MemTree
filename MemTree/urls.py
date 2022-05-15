from django.conf.urls import url
# from django.urls import path
from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^login/', views.login, name='login'),
    url(r'^logout/', views.logout, name='logout'),
    url(r'^registration/', views.registration, name='registration'),
    url(r'^delete-account/', views.delete_account, name='delete_account'),
]
