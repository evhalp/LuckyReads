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
from apps.books.serializers import BookSerializer, ReviewSerializer, ShelfEntrySerializer

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
    
