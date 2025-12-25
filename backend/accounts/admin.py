from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'firebase_uid', 'is_staff', 'is_active']
    list_filter = ['is_staff', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('Firebase', {'fields': ('firebase_uid',)}),
    )
    readonly_fields = ['firebase_uid']
