import requests
from django.db import transaction

from apps.books.models import Author, Book

def get_or_fetch_book(openlibrary_key: str) -> Book:
    does_exist = Book.objects.filter(openlibrary_key=openlibrary_key).first()
    if does_exist:
        return does_exist
    
    work_response = requests.get(
        f'https://openlibrary.org{openlibrary_key}.json',
        timeout=10
    )

    if not work_response.ok:
        raise ValueError(f'Could not fetch book data from OpenLibrary for key: {openlibrary_key}')
    
    work_data = work_response.json()

    title = work_data.get('title', 'Unknown Title')
    covers = work_data.get('covers', [])
    cover_url = f'https://covers.openlibrary.org/b/id/{covers[0]}-M.jpg' if covers else ''
    authors = []
    for author_entry in work_data.get("authors", []):
        author_key = author_entry.get("author", {}).get("key")
        if author_key is None or not author_key.strip():
            continue

        author_response = requests.get(
            f"https://openlibrary.org{author_key}.json",
            timeout=10,
        )

        if not author_response.ok:
            continue

        author_data = author_response.json()
        author, _ = Author.objects.get_or_create(
            openlibrary_key=author_key,
            defaults={
                "name": author_data.get("name", "Unknown Author"),
                "bio": (
                    author_data["bio"].get("value", "")
                    if isinstance(author_data.get("bio"), dict)
                    else author_data.get("bio", "")
                ),
                "photo_url": (
                    f"https://covers.openlibrary.org/a/id/{author_data['photos'][0]}-M.jpg"
                    if author_data.get("photos")
                    else ""
                ),
            },
        )
        authors.append(author)

    with transaction.atomic():
        book = Book.objects.create(
            openlibrary_key=openlibrary_key,
            title=title,
            cover_url=cover_url
        )
        book.authors.set(authors)

    return book