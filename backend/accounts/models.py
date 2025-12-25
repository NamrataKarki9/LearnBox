from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model with Firebase UID for authentication
    """
    email = models.EmailField(unique=True)
    firebase_uid = models.CharField(max_length=255, unique=True, null=True, blank=True)
    
    def __str__(self):
        return self.username
