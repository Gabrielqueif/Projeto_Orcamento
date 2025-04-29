from django.urls import path, include
from .views import InsumoViewSet, ComposicoesViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'insumos', InsumoViewSet)
router.register(r'composicoes', ComposicoesViewSet)

urlpatterns = [
    path('api/', include(router.urls))
]

