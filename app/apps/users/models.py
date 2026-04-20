from typing import ClassVar

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, AbstractUser, BaseUserManager, PermissionsMixin
from django.core.validators import RegexValidator, validate_email
from django.utils.translation import gettext_lazy as _
from django.core import exceptions

from apps.core.abstracts.models import ManagerBase, UniqueModel

class UserManager(BaseUserManager, ManagerBase["User"]):
    """Manager for users."""


    def create(self, **kwargs):
        return self.create_user(**kwargs)
    
    def create_user(self, email, password=None, username=None, **extra_fields):
        """Create, save, and return a new user. Add user to base group."""
        if not email:
            raise ValueError("User must have an email address")

        email = self.normalize_email(email)

        if username is None:
            username = email

        user: User = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)

        user.save(using=self._db)

        return user
    

    def create_superuser(self, email, password, **extra_fields):
        """Create and return a new superuser."""
        user = self.create_user(email, password, **extra_fields)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)

        return user
    
    def create_adminuser(self, email, password, **extra_fields):
        """Create and return a new admin user."""
        user = self.create_user(email, password, **extra_fields)
        user.is_staff = True
        user.is_superuser = False
        user.save(using=self._db)

        return user
    
    

class User(AbstractBaseUser, PermissionsMixin, UniqueModel):
  
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    email = models.EmailField(max_length=64, unique=True, null=True, blank=True)
    username = models.CharField(max_length=64, unique=True, blank=True)
    password = models.CharField(_("password"), max_length=128, blank=True)

    date_joined = models.DateTimeField(auto_now_add=True, editable=False, blank=True)
    date_modified = models.DateTimeField(auto_now=True, editable=False, blank=True)

    bio = models.TextField(blank=True, default='')
    avatar_url = models.URLField(blank=True, default='')

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='+',
        blank=True
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='+',
        blank=True
    )

    USERNAME_FIELD = "username"

    objects: ClassVar[UserManager] = UserManager()

    # Dynamic Properties
    @property
    def name(self) -> str:
        return self.username
    
    class Meta:
        db_table = 'users_user'

    def __str__(self):
        return self.username
    
    def validate_email(self):
        """Check that email is valid."""

        if self.email is None:
            return

        # Check email unique among users
        if (
            User.objects.filter(email=self.email)
            .exclude(id=self.id)
            .exists()
        ):
            raise exceptions.ValidationError({"email": "Email is already in use"})


        # Check username value
        #username_is_email = False
        try:
            validate_email(self.username)
            #username_is_email = True
        except exceptions.ValidationError:
            pass

    def clean(self):
      # If user is created through some other method, ensure username is set.
      if self.username is None or self.username == "":
          self.username = self.email

      self.validate_email()

      return super().clean()
    
class BuddyRelationship(UniqueModel):
    """
    Represents a one-way buddy relationship between two users.
    The user field is the user who added the buddy.
    The buddy field is the user who was added.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="buddies"
    )
    buddy = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="buddy_of"
    )

    class Meta:
        db_table = "users_buddies"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "buddy"],
                name="unique_buddies"
            ),
            models.CheckConstraint(
                condition=~models.Q(user=models.F("buddy")),
                name="no_self_buddy",
                violation_error_message="A user cannot add themselves as a buddy"
            )
        ]

    def __str__(self):
        return f"{self.user.username} -> {self.buddy.username}"
