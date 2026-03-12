from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator

class Author(models.Model):
    openlibrary_key = models.CharField(
        max_length=64,
        unique=True,
        db_index=True
    )
    name = models.CharField(max_length=128)
    bio = models.TextField(blank=True, default='')
    photo_url = models.URLField(blank=True, default='')

    class Meta:
        db_table = 'books_author'

    def __str__(self):
        return self.name
    
class Book(models.Model):
    openlibrary_key = models.CharField(
        max_length=64,
        unique=True,
        db_index=True
    )
    isbn = models.CharField(
        max_length=13,
        unique=True,
        null=True,
        blank=True
    )
    title = models.CharField(max_length=512)
    authors = models.ManyToManyField(
        Author,
        related_name='books',
        blank=True
    )
    cover_url = models.URLField(blank=True, default='')

    class Meta:
        db_table = 'books_book'

    def __str__(self):
        return self.title
    
class ShelfEntry(models.Model):

    class Status(models.TextChoices):
        WANT_TO_READ = 'want_to_read', 'Want to Read'
        CURRENTLY_READING = 'currently_reading', 'Currently Reading'
        READ = 'read', 'Read'
        DID_NOT_FINISH = 'did_not_finish', 'Did Not Finish'

    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='shelf_entries'
    )
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='shelf_entries'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.WANT_TO_READ 
    )
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'books_shelf_entry'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'book'],
                name='unique_shelf_entry'
            )
        ]

    def __str__(self):
        return f'{self.user.username}: {self.book.title} ({self.status})'
    
class Review(models.Model):
    shelf_entry = models.OneToOneField(
        ShelfEntry,
        on_delete=models.CASCADE,
        related_name='review'
    )
    rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    review_text = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'books_book_review'
        constraints = [
            models.CheckConstraint(
                condition=models.Q(rating__isnull=True) | (models.Q(rating__gte=1) & models.Q(rating__lte=5)),
                name='rating_between_1_and_5',
                violation_error_message='Rating must be between 1 and 5'
            )
        ]

    def __str__(self):
        return f'{self.shelf_entry.user.username}: {self.shelf_entry.book.title} ({self.rating} / 5)'