from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate

from apps.core.abstracts.serializers import ModelSerializer, ModelSerializerBase
from apps.users.models import User, BuddyRelationship

class UserSerializer(ModelSerializer):

  email = serializers.EmailField()
  username = serializers.CharField(required=False)
  bio = serializers.CharField(required=False, allow_blank=True)

  class Meta:
    model = User
    fields = [
      *ModelSerializerBase.default_fields,
      "username",
      "email",
      "bio",
    ]

  def validate(self, attrs: dict) -> dict:
    username = attrs.get("username")

    if username is not None:
      queryset = User.objects.filter(username=username)
      if self.instance is not None:
        queryset = queryset.exclude(id=self.instance.id)

      if queryset.exists():
        raise serializers.ValidationError(
          {"username": "A user with this username already exists."}
        )

    return attrs

  def create(self, validated_data: dict) -> User:
    """Create and return a user with encrypted password"""
    return get_user_model().objects.create_user(**validated_data)
  
  def update(self, instance: User, validated_data: dict) -> User:
     """Update and return user"""
     validated_data.pop("password", None)
     return super().update(instance, validated_data)
  
class PublicUserSerializer(ModelSerializer):
  
  class Meta:
    model = User
    fields = [
        *ModelSerializerBase.default_fields,
        "username",
        "bio",
    ]
    read_only_fields = ['id', 'username', 'bio']

class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password']

    def validate(self, data: dict) -> dict:
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError('Passwords do not match.')
        return data
    
    def create(self, validated_data: dict) -> User:
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        return user
    
class LoginSerializer(serializers.Serializer):

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data: dict) -> dict:
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled.')
        data['user'] = user
        return data

class BuddyRelationshipSerializer(ModelSerializer):
   buddy = PublicUserSerializer(read_only=True)

   class Meta:
      model = BuddyRelationship
      fields = [*ModelSerializerBase.default_fields, 'buddy']
      read_only_fields = ['buddy']
