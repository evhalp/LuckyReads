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


class ReviewViewSet(CreateModelMixin, ListModelMixin, DestroyModelMixin, UpdateModelMixin, ViewSetBase):
  """
  POST /api/reviews/
  """

  serializer_class = ReviewSerializer

  def get_queryset(self):
    if getattr(self, 'swagger_fake_view', False):
      return Review.objects.none()
    return Review.objects.filter(shelf_entry__user=self.request.user).select_related('shelf_entry__book')
  
    
  def get_object(self):
    obj = super().get_object()
    if obj.shelf_entry.user != self.request.user:
      raise PermissionDenied("You can only modify your own reviews.")
    return obj


class ShelfViewSet(CreateModelMixin, ListModelMixin, DestroyModelMixin, UpdateModelMixin, ViewSetBase):
    """
    GET /api/shelf/
    POST /api/shelf/
    """

    serializer_class = ShelfEntrySerializer

    def get_queryset(self):
      if getattr(self, 'swagger_fake_view', False):
        return ShelfEntry.objects.none()
      return ShelfEntry.objects.filter(user=self.request.user).select_related('book', 'review').prefetch_related('book__authors')
    
    def create(self, request, *args, **kwargs):
      openlibrary_key = request.data.get('openlibrary_key')
      title = request.data.get('title')
      cover_url = request.data.get('cover_url', '')
      author_names = request.data.get('authors', [])

      if not openlibrary_key:
          return Response(
              {'error': 'openlibrary_key is required'},
              status=status.HTTP_400_BAD_REQUEST
          )

      if ShelfEntry.objects.filter(
          user=request.user,
          book__openlibrary_key=openlibrary_key
      ).exists():
          return Response(
              {'error': 'Book already on shelf'},
              status=status.HTTP_400_BAD_REQUEST
          )

      book, created = Book.objects.get_or_create(
          openlibrary_key=openlibrary_key,
          defaults={
              'title': title,
              'cover_url': cover_url,
          }
      )

      if created:
          for author_name in author_names:
              if not author_name or not author_name.strip():
                  continue
              author, _ = Author.objects.get_or_create(
                  name=author_name.strip(),
                  defaults={
                      # This is temporary for the MVP. If we wanted to add author profiles, we'd need to backfill this
                      'openlibrary_key': f'search_{author_name.strip().lower().replace(" ", "_")}',
                  }
              )
              book.authors.add(author)

      shelf_entry = ShelfEntry.objects.create(
          user=request.user,
          book=book,
          status=request.data.get('status', ShelfEntry.Status.WANT_TO_READ)
      )

      return Response(
          ShelfEntrySerializer(shelf_entry, context={'request': request}).data,
          status=status.HTTP_201_CREATED
      )
