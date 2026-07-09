from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_JWT_SECRET = "dev-secret-change-in-production"
INSECURE_JWT_SECRETS = frozenset({DEFAULT_JWT_SECRET, "dev-secret", "change-me-in-production"})


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_env: str = "development"  # development | production

    llm_api_key: str = ""
    llm_base_url: str = "https://api.deepseek.com/v1"
    llm_model: str = "deepseek-chat"
    database_url: str = "sqlite:///./atoms_demo.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Auth: local (default) or supabase
    auth_mode: str = "local"  # local | supabase
    jwt_secret: str = DEFAULT_JWT_SECRET
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7

    supabase_url: str = ""
    supabase_jwt_secret: str = ""

    # LangSmith
    langchain_tracing_v2: str = "false"
    langchain_api_key: str = ""
    langchain_project: str = "atoms-demo"

    demo_email: str = "demo@atoms.demo"
    demo_password: str = "demo123456"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()


def validate_settings() -> None:
    if settings.app_env.lower() != "production":
        return
    if settings.jwt_secret in INSECURE_JWT_SECRETS:
        raise RuntimeError(
            "JWT_SECRET must be set to a secure value when APP_ENV=production "
            f"(got insecure default: {settings.jwt_secret!r})"
        )


validate_settings()

# Enable LangSmith when configured
if settings.langchain_api_key:
    import os

    os.environ.setdefault("LANGCHAIN_TRACING_V2", settings.langchain_tracing_v2)
    os.environ.setdefault("LANGCHAIN_API_KEY", settings.langchain_api_key)
    os.environ.setdefault("LANGCHAIN_PROJECT", settings.langchain_project)
