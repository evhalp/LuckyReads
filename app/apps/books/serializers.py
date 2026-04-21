from rest_framework import serializers

from apps.core.abstracts.serializers import ModelSerializer
from apps.books.models import Author, Book, Review, ShelfEntry
from apps.books.services import get_or_fetch_book

class AuthorSerializer(ModelSerializer):
    class Meta:
        model = Author
        fields = ['id', 'openlibrary_key', 'name', 'photo_url']

class BookSerializer(ModelSerializer):
    authors = AuthorSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = ['id', 'openlibrary_key', 'title', 'authors', 'cover_url', 'isbn', "average_rating"]


class ReviewSerializer(ModelSerializer):
    shelf_entry_id = serializers.IntegerField(write_only=True)
    rating = serializers.IntegerField(min_value=1, max_value=5)
    review_text = serializers.CharField(required=False, default='', allow_blank=True)

    def validate_shelf_entry_id(self, value):
        "Validate given shelf entry to see if it is in the shelf"

        #Skip validation on patch
        if self.instance is not None:  # skip validation on update
            return value

        request =  self.context["request"]
        shelf_entry = ShelfEntry.objects.filter(id=value, user=request.user).first()
        if not shelf_entry:
            raise serializers.ValidationError('Shelf entry not found or does not belong to you.')
        return value
    
    def create(self, validated_data):
        """Create the review given shelf entry id"""

        shelf_entry_id = validated_data.pop('shelf_entry_id')
        review, _ = Review.objects.update_or_create(
            shelf_entry_id=shelf_entry_id,
            defaults=validated_data
        )
        return review

    def update(self, instance, validated_data):
      #Get rid of shelf_entry_id
      validated_data.pop('shelf_entry_id', None)
      return super().update(instance, validated_data)

    class Meta:
        model = Review
        fields = ['id', 'shelf_entry_id', 'rating', 'review_text' , 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class NestedReviewSerializer(ModelSerializer):
    """Nested Review Serializer for Shelf API"""

    class Meta:
        model = Review
        #Review Field is optional, mainly to reduce load on server calls for now
        fields = ['id', 'rating']

class ShelfEntrySerializer(ModelSerializer):
    book = BookSerializer(read_only=True)
    openlibrary_key = serializers.CharField(write_only=True)
    title = serializers.CharField(write_only=True, required=True)
    cover_url = serializers.URLField(write_only=True, required=False, default='')
    authors = serializers.ListField(child=serializers.CharField(), write_only=True, required=False, default=list)
    review = NestedReviewSerializer(read_only=True)

    class Meta:
        model = ShelfEntry
        fields = ['id', 'book', 'openlibrary_key', 'title', 'cover_url', 'authors', 'status', 'review', 'added_at']
        read_only_fields = ['id', 'added_at']


    def create(self, validated_data):
        openlibrary_key = validated_data.pop('openlibrary_key')
        title = validated_data.pop('title')
        cover_url = validated_data.pop('cover_url', '')
        authors = validated_data.pop('authors', [])

        book, created = Book.objects.get_or_create(
            openlibrary_key=openlibrary_key,
            defaults={'title': title, 'cover_url': cover_url}
        )

        if created:
            for author_name in authors:
                author, _ = Author.objects.get_or_create(name=author_name)
                book.authors.add(author)

        validated_data['user'] = self.context['request'].user
        validated_data['book'] = book
        return super().create(validated_data)