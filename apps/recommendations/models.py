from django.db import models

class BookRecommendation(models.Model):
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='book_recommendations'
    )
    book = models.ForeignKey(
        'books.Book',
        on_delete=models.CASCADE,
        related_name='recommendations'
    )
    score = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'recommendations_book'
        ordering = ['-score']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'book'],
                name='unique_book_recommendation'
            )
        ]

    def __str__(self):
        return f'{self.user.username}: {self.book.title} ({self.score:.3f})'
    
class BuddyRecommendation(models.Model):
    from_user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='outgoing_buddy_recommendations'
    )
    to_user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='incoming_buddy_recommendations'
    )
    score = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'recommendations_buddy'
        ordering = ['-score']
        constraints = [
            models.UniqueConstraint(
                fields=['from_user', 'to_user'],
                name='unique_buddy_recommendation'
            ),
            models.CheckConstraint(
                condition=~models.Q(from_user=models.F('to_user')),
                name='buddy_recommendation_no_self_recommendations',
                violation_error_message='A user cannot be recommended themselves as a buddy'
            )
        ]

    def __str__(self):
        return f'{self.from_user.username}: {self.to_user.username} ({self.score:.3f})'