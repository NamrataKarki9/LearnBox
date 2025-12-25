from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    firebase_uid = serializers.CharField(required=False, write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name', 'firebase_uid')
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False}
        }
    
    def validate(self, attrs):
        """
        Validate that passwords match
        """
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs
    
    def validate_email(self, value):
        """
        Validate that email is unique
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def create(self, validated_data):
        """
        Create user with Firebase UID
        """
        validated_data.pop('password2')
        firebase_uid = validated_data.pop('firebase_uid', None)
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            firebase_uid=firebase_uid
        )
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """
        Validate email and password
        """
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            # Get user by email
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError({
                    'error': 'Invalid email or password.'
                })
            
            # Authenticate with username (since Django authenticates with username)
            user = authenticate(username=user.username, password=password)
            
            if not user:
                raise serializers.ValidationError({
                    'error': 'Invalid email or password.'
                })
            
            if not user.is_active:
                raise serializers.ValidationError({
                    'error': 'User account is disabled.'
                })
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError({
                'error': 'Must include "email" and "password".'
            })


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for requesting password reset
    """
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """
        Validate that user with this email exists
        """
        if not User.objects.filter(email=value).exists():
            # Don't reveal if email exists or not for security
            # Just return the value, actual check happens in view
            pass
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for confirming password reset with token
    """
    token = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """
        Validate that passwords match
        """
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user details
    """
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'firebase_uid')
        read_only_fields = ('id', 'firebase_uid')


class FirebaseTokenSerializer(serializers.Serializer):
    """
    Serializer for Firebase ID token authentication
    """
    idToken = serializers.CharField(required=True)
