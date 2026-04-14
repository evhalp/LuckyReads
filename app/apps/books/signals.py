from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.books.models import Review

@receiver(post_save, sender=Review)
def on_review_saved(sender, instance, **kwargs):
    if not settings.DJANGO_ENABLE_CELERY:
        return

    from apps.recommendations.tasks import update_book_recommendations, update_buddy_recommendations

    user_id: int = instance.shelf_entry.user_id
    update_book_recommendations.delay(user_id)
    update_buddy_recommendations.delay(user_id)