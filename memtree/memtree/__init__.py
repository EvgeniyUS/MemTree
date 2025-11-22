import redis
from django.conf import settings
from django.core.management.utils import get_random_secret_key


def get_secret_key():
    """ Получает SECRET_KEY из Redis или генерирует новый и сохраняет в Redis.  """
    redis_client = redis.StrictRedis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        password=settings.REDIS_PASSWORD,
        decode_responses=True
    )

    key_name = "django:secret_key"

    # Пытаемся получить ключ из Redis
    secret_key = redis_client.get(key_name)

    if secret_key is None:
        secret_key = get_random_secret_key()
        # Сохраняем в Redis
        redis_client.set(key_name, secret_key)

    return secret_key
