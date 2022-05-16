from django.conf.urls import url
# from django.urls import path
from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^items/', views.items, name='items'),
    url(r'^login/', views.login, name='login'),
    url(r'^logout/', views.logout, name='logout'),
    url(r'^registration/', views.registration, name='registration'),
    url(r'^delete-account/', views.delete_account, name='delete_account'),
    url(r'^create/', views.create, name='create'),
    url(r'^collapse/', views.collapse, name='collapse'),
    url(r'^change-name/', views.change_name, name='change_name'),
    url(r'^move/', views.move, name='move'),
    url(r'^delete/', views.delete, name='delete'),
]
