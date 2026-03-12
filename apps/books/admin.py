from django.contrib import admin
from .models import Author, Book, ShelfEntry, Review

@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ('name', 'openlibrary_key')
    search_fields = ('name', 'openlibrary_key')

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'openlibrary_key', 'isbn')
    search_fields = ('title', 'openlibrary_key', 'isbn')

    filter_horizontal = ('authors',)

@admin.register(ShelfEntry)
class ShelfEntryAdmin(admin.ModelAdmin):
    list_display = ('user', 'book', 'status', 'added_at')
    list_filter = ('status',)
    search_fields = ('user__username', 'book__title')

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('get_user', 'get_book', 'rating', 'created_at')
    search_fields = ('shelf_entry__user__username', 'shelf_entry__book__title')

    @admin.display(description='User')
    def get_user(self, obj):
        return obj.shelf_entry.user.username
    
    @admin.display(description='Book')
    def get_book(self, obj):
        return obj.shelf_entry.book.title
