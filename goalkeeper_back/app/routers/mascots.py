from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.core.dependencies import get_current_user_info

router = APIRouter()

# 1. 상점: 전체 마스코트 목록 보기
@router.get("/", response_model=list[schemas.MascotResponse])
def get_all_mascots(db: Session = Depends(get_db)):
    return db.query(models.Mascot).all()

# 🟢 [핵심 수정] 내 마스코트 목록 (없으면 기본 지급)
@router.get("/my", response_model=list[schemas.UserMascotResponse])
def get_my_mascots(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    
    return db.query(models.UserMascot).filter(models.UserMascot.user_id == user_id).all()

# 현재 장착 중인 마스코트 조회
@router.get("/equipped", response_model=schemas.UserMascotResponse)
def get_equipped_mascot(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    
    # 장착된 놈 찾기
    equipped = db.query(models.UserMascot).filter(
        models.UserMascot.user_id == user_id,
        models.UserMascot.is_active == True
    ).first()            
    return equipped

# 3. 마스코트 구매하기
@router.post("/{mascot_id}/buy")
def buy_mascot(
    mascot_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    mascot = db.query(models.Mascot).filter(models.Mascot.mascot_id == mascot_id).first()
    
    if not mascot:
        raise HTTPException(status_code=404, detail="Mascot not found")

    existing = db.query(models.UserMascot).filter(
        models.UserMascot.user_id == user_id,
        models.UserMascot.mascot_id == mascot_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="이미 가지고 있는 마스코트입니다.")
    
    if user.cash < mascot.price:
        raise HTTPException(status_code=400, detail="캐시가 부족합니다.")
    
    user.cash -= mascot.price
    new_user_mascot = models.UserMascot(user_id=user.id, mascot_id=mascot.mascot_id, is_active=False)
    
    db.add(new_user_mascot)
    db.commit()
    
    return {"message": f"{mascot.name} 구매 완료!", "remaining_cash": user.cash}

# 4. 마스코트 장착하기
@router.post("/{mascot_id}/equip")
def equip_mascot(
    mascot_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    
    my_mascot = db.query(models.UserMascot).filter(
        models.UserMascot.user_id == user_id, 
        models.UserMascot.mascot_id == mascot_id
    ).first()
    
    if not my_mascot:
        raise HTTPException(status_code=400, detail="구매하지 않은 마스코트입니다.")
    
    # 1. 기존 장착 다 해제
    db.query(models.UserMascot).filter(models.UserMascot.user_id == user_id).update({"is_active": False})
    
    # 2. 선택한 것 장착
    my_mascot.is_active = True
    db.commit()
    
    return {"message": "마스코트 장착 완료!"}