from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):

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

    class Meta:
        db_table = 'users_user'

    def __str__(self):
        return self.username
