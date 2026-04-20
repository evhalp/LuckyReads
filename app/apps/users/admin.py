from django.contrib import admin

from apps.core.admin import ModelAdminBase
from .models import BuddyRelationship, User


class UserAdmin(ModelAdminBase):
  list_display = ("username", "email", "is_staff", "is_active")
  search_fields = ("username", "email")
  readonly_fields = ("date_joined", "date_modified")


class BuddyRelationshipAdmin(ModelAdminBase):
  list_display = ("user", "buddy")
  search_fields = ("user__username", "buddy__username")


admin.site.register(User, UserAdmin)
admin.site.register(BuddyRelationship, BuddyRelationshipAdmin)