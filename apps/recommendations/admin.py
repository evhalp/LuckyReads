from django.contrib import admin
from .models import BookRecommendation, BuddyRecommendation

@admin.register(BookRecommendation)
class BookRecommendationAdmin(admin.ModelAdmin):
    list_display = ('user', 'book', 'score', 'created_at')
    search_fields = ('user__username', 'book__title')

@admin.register(BuddyRecommendation)
class BuddyRecommendationAdmin(admin.ModelAdmin):
    list_display = ('from_user', 'to_user', 'score', 'created_at')
    search_fields = ('from_user__username', 'to_user__username')