from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.core.dependencies import get_current_user_info

router = APIRouter()

# 1. 내 프로필 조회 (마이페이지용)
@router.get("/me", response_model=schemas.UserResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

# 내 정보 수정 (닉네임 + 이메일)
@router.patch("/me", response_model=schemas.UserResponse)
def update_my_profile(
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 닉네임 수정
    if user_update.nickname:
        user.nickname = user_update.nickname
        
    # 카카오라서 못 받았던 이메일, 여기서 수정 가능!
    if user_update.email:
        user.email = user_update.email
    
    db.commit()
    db.refresh(user)
    return user

# 회원 탈퇴 (전체 삭제)
@router.delete("/me")
def withdraw_account(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"message": "회원 탈퇴가 완료되었습니다. 모든 정보가 삭제되었습니다."}
