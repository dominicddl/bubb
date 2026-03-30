from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str = "http://127.0.0.1:54321"
    supabase_service_role_key: str = ""
    supabase_anon_key: str = ""
    supabase_jwt_secret: str = ""
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    gemini_api_key: str = ""
    default_ai_provider: str = "openai"
    cors_origins: list[str] = ["chrome-extension://*"]

    model_config = {"env_file": ["../.env", ".env"]}


settings = Settings()
