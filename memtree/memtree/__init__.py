from django.core.management.utils import get_random_secret_key


def get_secret_key():
    try:
        from .utils import REDIS_CLIENT

        key_name = "django:secret_key"

        secret_key = REDIS_CLIENT.get(key_name)

        if secret_key is None:
            secret_key = get_random_secret_key()
            REDIS_CLIENT.set(key_name, secret_key)

        return secret_key
    except Exception:
        return get_random_secret_key()
