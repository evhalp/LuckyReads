from rest_framework import generics, mixins, permissions, serializers, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action

from drf_spectacular.utils import extend_schema

from apps.core.utils import Query, query_parameters
from apps.core.abstracts.viewsets import ModelViewSetBase, ViewSetBase
from apps.users.models import User
from apps.users.permissions import IsOwnerOrReadOnly
from apps.users.serializers import (
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
    PublicUserSerializer,
    ReaderListUserSerializer,
)

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
    
class UserViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, ViewSetBase):
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


    def get_serializer_class(self) -> type[serializers.ModelSerializer]:
        if self.action in ('list'):
            return ReaderListUserSerializer
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
