from django.urls import path, include
from .views import InsumoViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'insumos', InsumoViewSet)

urlpatterns = [
    path('api/', include(router.urls))
]

