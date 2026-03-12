from django.db import models

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
    