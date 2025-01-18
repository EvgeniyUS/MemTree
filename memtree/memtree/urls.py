from django.conf.urls import include
from django.urls import path
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from memtree.views import (
    index, login, logout, registration, delete_account, user_help, password_change)
from item.views import ItemViewSet

router = DefaultRouter()
router.register(r'items', ItemViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', index, name='index'),
    path('login/', login, name='login'),
    path('logout/', logout, name='logout'),
    path('registration/', registration, name='registration'),
    path('password-change/', password_change, name='password_change'),
    path('delete-account/', delete_account, name='delete_account'),
    path('user-help/', user_help, name='user_help'),
    path('api/', include(router.urls)),
]
