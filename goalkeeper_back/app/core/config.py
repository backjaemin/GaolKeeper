import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

class Settings:
    # DB 접속 정보
    DB_URL = os.getenv("DB_URL")
    
    # 보안 키
    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    
    ACCESS_TOKEN_EXPIRE_MINUTES = 1440


settings = Settings()