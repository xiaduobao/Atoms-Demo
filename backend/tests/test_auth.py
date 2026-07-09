import pytest
from app.auth import (
    create_access_token,
    decode_token,
    get_optional_user,
    hash_password,
    verify_password,
)
from jose.exceptions import JWTError


def test_password_hash_roundtrip():
    hashed = hash_password("my-password")
    assert verify_password("my-password", hashed)
    assert not verify_password("wrong", hashed)


def test_create_and_decode_access_token():
    token = create_access_token("user-1", "user@example.com")
    payload = decode_token(token)
    assert payload["sub"] == "user-1"
    assert payload["email"] == "user@example.com"


def test_decode_token_rejects_invalid():
    with pytest.raises(JWTError):
        decode_token("not-a-token")


def test_get_optional_user_without_credentials():
    assert get_optional_user(None, db=None) is None  # type: ignore[arg-type]
