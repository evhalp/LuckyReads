from rest_framework import generics, mixins, permissions, serializers, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action

from drf_spectacular.utils import extend_schema

from apps.core.utils import Query, query_parameters
from apps.core.abstracts.viewsets import ModelViewSetBase, ViewSetBase
from apps.users.models import User, BuddyRelationship
from apps.users.permissions import IsOwnerOrReadOnly
from apps.users.serializers import LoginSerializer, RegisterSerializer, UserSerializer, PublicUserSerializer, BuddyRelationshipSerializer

@extend_schema(
    request=RegisterSerializer,
    responses={201: UserSerializer}
)
class RegisterView(APIView):
    """
    POST /api/users/register
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request: Request) -> Response:
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                'token': token.key,
                'user': UserSerializer(user, context={'request': request}).data
            },
            status=status.HTTP_201_CREATED
        )
  
class LoginView(APIView):
    """
    POST /api/users/login/
    """

    permission_classes = [permissions.AllowAny]

    @extend_schema(
        request=LoginSerializer,
        responses={200: UserSerializer}
    )
    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                'token': token.key,
                'user': UserSerializer(user, context={'request': request}).data
            }
        )
    
class UserViewSet(mixins.RetrieveModelMixin, ViewSetBase):
    """
    GET /api/users/{id}
    GET /api/users/search/?username={username}
    """

    queryset = User.objects.filter(is_active=True)
    permission_classes = [IsOwnerOrReadOnly]
    serializer_class = UserSerializer

    @query_parameters(username=Query(required=True))
    @action(detail=False, url_path="search")
    def search(self, request, *arg, **kwargs):
        """Search by username"""
        username = request.query_params.get('username')
        if not username:
            return Response({'error': 'username is required'}, status=400)
        
        obj = generics.get_object_or_404(User, username=username, is_active=True)
        self.check_object_permissions(request, obj)
        serializer = self.get_serializer(obj)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path="buddy")
    def add_buddy(self, request, *args, **kwargs):
        """Add the specified user as a buddy"""
        target_user = generics.get_object_or_404(
            User, id=self.kwargs['pk'], is_active=True
        )

        if target_user == request.user:
            return Response(
                {'error': 'A user cannot be their own buddy'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        relationship, was_created = BuddyRelationship.objects.get_or_create(
            user=request.user,
            buddy=target_user
        )

        if not was_created:
            return Response(
                {'error': 'You are already buddies with this user'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(
            BuddyRelationshipSerializer(relationship, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['get'], url_path="buddies")
    def list_buddies(self, request, *args, **kwargs):
        """Returns the specified user's buddies."""
        target_user = generics.get_object_or_404(
            User, id=self.kwargs['pk'], is_active=True
        )
        relationships = BuddyRelationship.objects.filter(
            user=target_user
        ).select_related("buddy")
        serializer = BuddyRelationshipSerializer(
            relationships, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="buddies/check")
    def check_buddy(self, request, buddy_id=None, *args, **kwargs):
        """Returns whether the specified user and another user are buddies."""
        target_user = generics.get_object_or_404(
            User, id=self.kwargs['pk'], is_active=True
        )
        buddy_id = request.query_params.get('buddy_id')
        if not buddy_id:
            return Response(
                {'error': 'buddy_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        buddy = generics.get_object_or_404(User, id=buddy_id, is_active=True)
        are_buddies = BuddyRelationship.objects.filter(
            user=target_user,
            buddy=buddy,
        ).exists()

        return Response({"are_buddies": are_buddies})

    @add_buddy.mapping.delete
    def remove_buddy(self, request, *args, **kwargs):
        """Remove the specified user as a buddy"""
        target_user = generics.get_object_or_404(
            User, id=self.kwargs['pk'], is_active=True
        )

        was_deleted, _ = BuddyRelationship.objects.filter(
            user=request.user,
            buddy=target_user
        ).delete()

        if not was_deleted:
            return Response(
                {'error': 'You are not buddies with this user'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_serializer_class(self) -> type[serializers.ModelSerializer]:
        if self.action in ('retrieve'):
            obj = self.get_object()
            if obj == self.request.user:
              return UserSerializer
        return PublicUserSerializer
    
    def perform_destroy(self, instance: User) -> None:
        instance.is_active = False
        instance.save()


class ManageUserView(mixins.RetrieveModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, ViewSetBase):
    """
    Manage the authenticated user.
    """

    serializer_class = UserSerializer
    authentication_classes = ModelViewSetBase.authentication_classes
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Retrieve and return the authenticated user."""
        return self.request.user
