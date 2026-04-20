from django.core.management.base import BaseCommand
from django.db import transaction
 
from apps.books.models import Author, Book, ShelfEntry, Review
from apps.recommendations.tasks import update_book_recommendations, update_buddy_recommendations
from apps.users.models import User

from apps.core.fixtures.test_data import AUTHORS, BOOKS, USERS

class Command(BaseCommand):
    help = 'Populate the database with test data. Safe to run multiple times'

    def handle(self, *args, **options) -> None:

        with transaction.atomic():
            authors: dict[str, Author] = self._populate_authors()
            books: dict[str, Book] = self._populate_books(authors)
            users: list[User] = self._populate_users(books)
            self._populate_recommendations(users)

        self.stdout.write('Database populated!')

    def _populate_authors(self) -> dict[str, Author]:
        self.stdout.write('Populating authors...')
        authors: dict[str, Author] = {}
        for data in AUTHORS:
            author, was_created = Author.objects.get_or_create(
                openlibrary_key=data['openlibrary_key'],
                defaults={'name': data['name']}
            )
            authors[data['openlibrary_key']] = author
            self.stdout.write(f'  {author} {"created" if was_created else "skipped"}')
        return authors
    
    def _populate_books(self, authors: dict[str, Author]) -> dict[str, Book]:
        self.stdout.write('Populating books...')
        books: dict[str, Book] = {}
        for data in BOOKS:
            book, was_created = Book.objects.get_or_create(
                openlibrary_key=data['openlibrary_key'],
                defaults={
                    'title': data['title'],
                    'cover_url': data['cover_url']
                }
            )
            for author_key in data['authors']:
                book.authors.add(authors[author_key])
            books[data['openlibrary_key']] = book
            self.stdout.write(f'  {book} {"created" if was_created else "skipped"}')
        return books

    def _populate_users(self, books: dict[str, Book]) -> list[User]:
        self.stdout.write('Populating users...')
        users: list[User] = []
        for data in USERS:
            user, was_created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': f'{data['username']}@test.com',
                    'password': 'password'
                    }
            )
            if was_created:
                user.set_password('password')
                user.save()
            for book_key, rating in data['ratings'].items():
                shelf_entry, _ = ShelfEntry.objects.get_or_create(
                    user=user,
                    book=books[book_key],
                    defaults={'status': ShelfEntry.Status.READ}
                )
                Review.objects.get_or_create(
                    shelf_entry=shelf_entry,
                    defaults={'rating': rating}
                )
            users.append(user)
            self.stdout.write(f'  {user} {"created" if was_created else "skipped"}')
        return users

    def _populate_recommendations(self, users: list[User]) -> None:
        self.stdout.write('Populating recommendations...')
        for user in users:
            update_book_recommendations(user.pk)
            update_buddy_recommendations(user.pk)
            self.stdout.write(f'   Populated recommendations for: {user.username}')