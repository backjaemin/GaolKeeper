from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app import models, schemas
from app.core.config import settings
from app.core.dependencies import get_current_user_info
from jose import jwt
from datetime import datetime, timedelta
import httpx
from app import schemas

# 구글 토큰 검증용 라이브러리
from google.oauth2 import id_token
from google.auth.transport import requests

router = APIRouter()

#  토큰 생성 함수 
def create_access_token(user_id: int, nickname: str):
    expire = datetime.utcnow() + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": str(user_id), "nickname": nickname, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# 🟢 [정석] 기본 아이템 지급 함수 (재사용성을 위해 분리)
def check_and_grant_default_items(db: Session, user_id: int, nickname: str):
    try:
        # 1. 마스코트 확인 ('짜근 하먀')
        default_mascot = db.query(models.Mascot).filter(models.Mascot.name == "짜근 하먀").first()
        if default_mascot:
            has_mascot = db.query(models.UserMascot).filter(
                models.UserMascot.user_id == user_id,
                models.UserMascot.mascot_id == default_mascot.mascot_id
            ).first()

            if not has_mascot:
                print(f"🎁 {nickname}님에게 [짜근 하먀] 지급 완료")
                # 지급하면서 바로 장착(is_active=True)
                db.add(models.UserMascot(user_id=user_id, mascot_id=default_mascot.mascot_id, is_active=True))

        # 2. 배경 확인 ('방')
        default_bg = db.query(models.Accessory).filter(models.Accessory.name == "방").first()
        if default_bg:
            has_room = db.query(models.UserAccessory).filter(
                models.UserAccessory.user_id == user_id,
                models.UserAccessory.accessory_id == default_bg.accessory_id
            ).first()

            if not has_room:
                print(f"🎁 {nickname}님에게 [방] 지급 완료")
                # 지급하면서 바로 장착(is_active=True)
                db.add(models.UserAccessory(user_id=user_id, accessory_id=default_bg.accessory_id, is_active=True))
        
        db.commit()

    except Exception as e:
        print(f"⚠️ 기본 아이템 지급 중 에러 (무시하고 진행): {e}")
        db.rollback() # 에러나면 롤백

#  카카오 SDK 로그인 
@router.post("/kakao")
async def kakao_native_login(
    req: schemas.SocialLoginRequest,  
    db: Session = Depends(get_db)
):
    kakao_access_token = req.token
    
    # 카카오 서버에 "이 토큰 주인 누구야?" 물어보기
    async with httpx.AsyncClient() as client:
        user_res = await client.get("https://kapi.kakao.com/v2/user/me", headers={
            "Authorization": f"Bearer {kakao_access_token}"
        })
    
    if user_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid Kakao Token")

    user_info = user_res.json()

    # 정보 추출
    provider_id = str(user_info.get("id"))
    kakao_account = user_info.get("kakao_account", {})
    properties = user_info.get("properties", {})
    
    nickname = properties.get("nickname")
    email = kakao_account.get("email")

    if not nickname:
        nickname = email.split("@")[0] if email else "Unknown"

    # 로그인/회원가입 처리
    user = db.query(User).filter(User.provider_id == provider_id, User.provider == "kakao").first()

    if not user:
        new_user = User(
            provider_id=provider_id,
            nickname=nickname,
            email=email,
            provider="kakao",
            level=1,
            exp=0,
            cash=0
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user = new_user
    check_and_grant_default_items(db, user.id, user.nickname)
    # 우리 서버 토큰 발급 
    access_token = create_access_token(
        user_id=user.id,
        nickname=user.nickname
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "nickname": user.nickname,
        "level": user.level,
        "cash": user.cash
    }

#  구글 SDK 로그인 (앱 전용) 
@router.post("/google")
async def google_native_login(
    req: schemas.SocialLoginRequest, 
    db: Session = Depends(get_db)
):
    try:
        # 구글 ID 토큰 검증 
        # 프론트에서 받은 req.token(idToken)이 진짜인지 확인
        idinfo = id_token.verify_oauth2_token(req.token, requests.Request())

        # 정보 추출
        provider_id = idinfo.get('sub') 
        email = idinfo.get('email')
        name = idinfo.get('name')
        
        # DB 확인 및 저장
        user = db.query(User).filter(User.provider_id == provider_id, User.provider == "google").first()

        if not user:
            new_user = User(
                provider_id=provider_id,
                nickname=name if name else "Unknown",
                email=email,
                provider="google",
                level=1,
                exp=0,
                cash=0
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user = new_user

        check_and_grant_default_items(db, user.id, user.nickname)

        # 우리 서버 토큰 발급
        access_token = create_access_token(
            user_id=user.id,
            nickname=user.nickname
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "nickname": user.nickname,
            "level": user.level,
            "cash": user.cash
        }

    except ValueError:
        # 토큰 위조, 만료 등의 경우
        raise HTTPException(status_code=400, detail="Invalid Google Token")


# 내 정보 조회
@router.get("/me")
def read_users_me(current_user: dict = Depends(get_current_user_info)):
    return {"user_info": current_user}
