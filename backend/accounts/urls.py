from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    RefreshTokenView,
    UserDetailView
)

urlpatterns = [
    # Authentication endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', RefreshTokenView.as_view(), name='token-refresh'),
    
    # User endpoints
    path('me/', UserDetailView.as_view(), name='user-detail'),
]
