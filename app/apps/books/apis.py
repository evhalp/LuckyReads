"""
URL Patterns for books REST API.
"""

from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.books import views
from apps.books import viewsets

router = DefaultRouter()
router.register("reviews", viewsets.ReviewViewSet, basename="review")
router.register("shelf", viewsets.ShelfViewSet, basename="shelf")

app_name = "api-books"

urlpatterns = [
    path('', views.BookListView.as_view(), name='book-list'),
    path('<int:pk>/detail/', views.BookDetailView.as_view(), name='book-detail'),
    path('olsearch/', views.OpenLibrarySearchView.as_view(), name='book-olsearch'),
    *router.urls
]
