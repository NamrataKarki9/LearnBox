# Firebase authentication utilities
# Email verification is handled by Firebase


def send_verification_email(user, request=None):
    """
    Generate verification code and send verification email
    
    Args:
        user: User instance
        request: Request object (optional)
    
    Returns:
        EmailVerificationToken instance
    """
    # Generate random 6-digit code
    code = str(random.randint(100000, 999999))
    
    # Create EmailVerificationToken
    verification_token = EmailVerificationToken.objects.create(
        user=user,
        code=code,
        expires_at=timezone.now() + timedelta(minutes=15)  # 15 minutes expiry
    )
    
    # Email subject and message
    subject = 'Your Verification Code - LearnBox'
    message = f"""
    Hi {user.username},
    
    Thank you for registering with LearnBox!
    
    Your email verification code is: {code}
    
    This code will expire in 15 minutes.
    
    If you didn't create an account, please ignore this email.
    
    Best regards,
    LearnBox Team
    """
    
    # HTML message
    html_message = f"""
    <html>
        <body>
            <h2>Hi {user.username},</h2>
            <p>Thank you for registering with LearnBox!</p>
            <p>Your email verification code is:</p>
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; 
                        font-size: 32px; font-weight: bold; letter-spacing: 8px; 
                        border-radius: 8px; margin: 20px 0;">
                {code}
            </div>
            <p><small>This code will expire in 15 minutes.</small></p>
            <p>If you didn't create an account, please ignore this email.</p>
            <br>
            <p>Best regards,<br>LearnBox Team</p>
        </body>
    </html>
    """
    
    # Send email
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
    except Exception as e:
        print(f"Error sending verification email: {str(e)}")
        # You might want to log this error
        raise
    
    return verification_token


def send_password_reset_email(user, request=None):
    """
    Generate password reset token and send reset email
    
    Args:
        user: User instance
        request: Request object (optional, used to build absolute URL)
    
    Returns:
        PasswordResetToken instance
    """
    # Generate unique token
    token = str(uuid.uuid4())
    
    # Create PasswordResetToken
    reset_token = PasswordResetToken.objects.create(
        user=user,
        token=token,
        expires_at=timezone.now() + timedelta(hours=1)  # 1 hour expiry for password reset
    )
    
    # Build reset link
    if request:
        # Use request to build absolute URL
        frontend_url = request.build_absolute_uri('/').replace('/api/', '')
        reset_link = f"{frontend_url}reset-password?token={token}"
    else:
        # Use settings or default frontend URL
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_link = f"{frontend_url}/reset-password?token={token}"
    
    # Email subject and message
    subject = 'Password Reset Request - LearnBox'
    message = f"""
    Hi {user.username},
    
    We received a request to reset your password for your LearnBox account.
    
    Please click the link below to reset your password:
    {reset_link}
    
    This link will expire in 1 hour.
    
    If you didn't request a password reset, please ignore this email or contact support if you have concerns.
    
    Best regards,
    LearnBox Team
    """
    
    # HTML message (optional)
    html_message = f"""
    <html>
        <body>
            <h2>Hi {user.username},</h2>
            <p>We received a request to reset your password for your LearnBox account.</p>
            <p>Please click the button below to reset your password:</p>
            <p>
                <a href="{reset_link}" 
                   style="background-color: #2196F3; color: white; padding: 14px 20px; 
                          text-decoration: none; border-radius: 4px; display: inline-block;">
                    Reset Password
                </a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <p>{reset_link}</p>
            <p><small>This link will expire in 1 hour.</small></p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            <br>
            <p>Best regards,<br>LearnBox Team</p>
        </body>
    </html>
    """
    
    # Send email
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
    except Exception as e:
        print(f"Error sending password reset email: {str(e)}")
        # You might want to log this error
        raise
    
    return reset_token


def verify_email_token(token):
    """
    Verify email token and mark user as verified
    
    Args:
        token: Token string
    
    Returns:
        tuple: (success: bool, message: str, user: User or None)
    """
    try:
        verification_token = EmailVerificationToken.objects.get(token=token)
        
        if not verification_token.is_valid():
            if verification_token.is_used:
                return (False, "This verification link has already been used.", None)
            else:
                return (False, "This verification link has expired.", None)
        
        # Mark token as used
        verification_token.is_used = True
        verification_token.save()
        
        # Mark user as verified
        user = verification_token.user
        user.email_verified = True
        user.save()
        
        return (True, "Email verified successfully!", user)
    
    except EmailVerificationToken.DoesNotExist:
        return (False, "Invalid verification token.", None)


def verify_password_reset_token(token):
    """
    Verify password reset token
    
    Args:
        token: Token string
    
    Returns:
        tuple: (success: bool, message: str, reset_token: PasswordResetToken or None)
    """
    try:
        reset_token = PasswordResetToken.objects.get(token=token)
        
        if not reset_token.is_valid():
            if reset_token.is_used:
                return (False, "This password reset link has already been used.", None)
            else:
                return (False, "This password reset link has expired.", None)
        
        return (True, "Token is valid.", reset_token)
    
    except PasswordResetToken.DoesNotExist:
        return (False, "Invalid password reset token.", None)
