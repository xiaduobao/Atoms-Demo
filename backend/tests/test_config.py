import pytest
from app import config


def test_validate_settings_allows_development_default():
    config.validate_settings()


def test_validate_settings_rejects_insecure_production_secret(monkeypatch):
    monkeypatch.setattr(config.settings, "app_env", "production")
    monkeypatch.setattr(config.settings, "jwt_secret", config.DEFAULT_JWT_SECRET)
    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        config.validate_settings()


def test_validate_settings_allows_secure_production_secret(monkeypatch):
    monkeypatch.setattr(config.settings, "app_env", "production")
    monkeypatch.setattr(config.settings, "jwt_secret", "production-secret-key-xyz")
    config.validate_settings()
