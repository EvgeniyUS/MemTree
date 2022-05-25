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
    url(r'^change-text/', views.change_text, name='change_text'),
    url(r'^move/', views.move, name='move'),
    url(r'^delete/', views.delete, name='delete'),
    url(r'^user-help/', views.user_help, name='user_help'),
]
