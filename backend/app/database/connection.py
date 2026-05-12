from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pydantic_settings import BaseSettings
from typing import Generator


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/desposte_db"
    SIPSA_WSDL: str = "http://appweb.dane.gov.co/sipsaWS/SrvSipsaUpraBeanService?WSDL"

    class Config:
        env_file = ".env"
        extra = "ignore"   # allow additional env vars without failing


settings = Settings()

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"client_encoding": "utf8", "options": "-c search_path=public"},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
