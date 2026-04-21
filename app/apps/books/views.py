import requests
from django.core.exceptions import PermissionDenied

from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from rest_framework.mixins import CreateModelMixin, ListModelMixin, DestroyModelMixin, UpdateModelMixin
from rest_framework import filters, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.core.abstracts.viewsets import ViewSetBase
from apps.books.models import Author, Book, Review, ShelfEntry
from apps.books.serializers import (
    BookDetailSerializer,
    BookPopupReviewSerializer,
    BookSerializer,
    ReviewSerializer,
    ShelfEntrySerializer,
)

class BookListView(generics.ListAPIView):
    """
    GET /api/books/
    GET /api/books/?q=<title>
    """

    serializer_class = BookSerializer
    queryset = Book.objects.prefetch_related('authors').all()
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'authors__name']


class OpenLibrarySearchView(APIView):
    """
    GET /api/books/olsearch/?q=<title>
    """

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='q',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=True,
                description='Search query to find books on OpenLibrary'
            )
        ],
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            502: OpenApiTypes.OBJECT
        }
    )
    def get(self, request) -> Response:
        query = request.query_params.get('q', '').strip()

        if not query:
            return Response(
                {'error': 'Search query is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        response = requests.get(
            'https://openlibrary.org/search.json',
            params={
                'q': query,
                'fields': 'key,title,author_name,cover_i',
                'limit': 10
            },
            timeout=10
        )

        if not response.ok:
            return Response(
                {'error': 'OpenLibrary search failed.'},
                status=status.HTTP_502_BAD_GATEWAY
            )
        
        results = []
        seen_keys = set()
        seen_title_authors_pairs = set()
        for doc in response.json().get('docs', []):
            key = doc.get('key')
            title = doc.get('title')
            authors = doc.get('author_name', [])
            title_authors_pair = (title, frozenset(author.lower() for author in authors))

            if not key or key in seen_keys or title_authors_pair in seen_title_authors_pairs:
                continue
            seen_keys.add(key)
            seen_title_authors_pairs.add(title_authors_pair)

            results.append({
                'openlibrary_key': key,
                'title': title,
                'authors': authors,
                'cover_url': f'https://covers.openlibrary.org/b/id/{doc["cover_i"]}-M.jpg' if doc.get('cover_i') else ''
            })

        return Response(results)


class BookDetailView(APIView):
    """
    GET /api/books/{id}/detail/
    """

    def _normalize_openlibrary_key(self, openlibrary_key: str) -> str:
        if not openlibrary_key:
            return ""
        return openlibrary_key if openlibrary_key.startswith("/") else f"/{openlibrary_key}"

    def _fetch_openlibrary_metadata(self, book: Book) -> dict:
        default_data = {
            "about": "",
            "genres": [],
            "isbn": book.isbn or "",
        }

        key = self._normalize_openlibrary_key(book.openlibrary_key)
        if not key:
            return default_data

        try:
            work_response = requests.get(
                f"https://openlibrary.org{key}.json",
                timeout=8,
            )
            if not work_response.ok:
                return default_data

            work_data = work_response.json()

            description = work_data.get("description", "")
            about = description.get("value", "") if isinstance(description, dict) else description

            subjects = work_data.get("subjects", [])
            genres = [subject for subject in subjects if isinstance(subject, str)][:8]

            isbn = book.isbn or ""
            if not isbn and work_data.get("key"):
                editions_response = requests.get(
                    f"https://openlibrary.org{work_data.get('key')}/editions.json?limit=1",
                    timeout=8,
                )
                if editions_response.ok:
                    entries = editions_response.json().get("entries", [])
                    if entries:
                        identifiers = entries[0].get("isbn_13") or entries[0].get("isbn_10") or []
                        if identifiers:
                            isbn = identifiers[0]

            return {
                "about": about or "",
                "genres": genres,
                "isbn": isbn,
            }
        except requests.RequestException:
            return default_data

    def get(self, request, pk: int) -> Response:
        book = generics.get_object_or_404(Book.objects.prefetch_related('authors'), id=pk)

        metadata = self._fetch_openlibrary_metadata(book)
        reviews = (
            Review.objects
            .filter(shelf_entry__book=book)
            .select_related('shelf_entry__user')
            .order_by('-created_at')
        )

        payload = BookDetailSerializer(book).data
        payload["about"] = metadata["about"]
        payload["genres"] = metadata["genres"]
        payload["isbn"] = metadata["isbn"] or payload.get("isbn")
        payload["reviews"] = BookPopupReviewSerializer(reviews, many=True).data

        return Response(payload)
    
