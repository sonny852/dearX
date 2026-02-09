from .auth import router as auth_router
from .people import router as people_router
from .messages import router as messages_router
from .storage import router as storage_router
from .chat import router as chat_router
from .premium import router as premium_router
from .payment import router as payment_router

__all__ = ["auth_router", "people_router", "messages_router", "storage_router", "chat_router", "premium_router", "payment_router"]
