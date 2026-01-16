from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app import models, schemas
from app.core.dependencies import get_current_user_info

router = APIRouter()

# 상점 목록
@router.get("/", response_model=list[schemas.AccessoryResponse])
def get_all_accessories(db: Session = Depends(get_db)):
    return db.query(models.Accessory).all()

# 🟢 [핵심 수정] 내 액세서리 목록 (없으면 '방' 자동 지급)
@router.get("/my", response_model=list[schemas.UserAccessoryResponse])
def get_my_accessories(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    

    return db.query(models.UserAccessory).options(joinedload(models.UserAccessory.accessory)).filter(models.UserAccessory.user_id == user_id).all()

# 장착 중인 목록
@router.get("/equipped", response_model=list[schemas.UserAccessoryResponse])
def get_equipped_accessories(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])

    
    return db.query(models.UserAccessory).options(joinedload(models.UserAccessory.accessory)).filter(
        models.UserAccessory.user_id == user_id,
        models.UserAccessory.is_active == True
    ).all()
# 구매
@router.post("/{accessory_id}/buy")
def buy_accessory(
    accessory_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    item = db.query(models.Accessory).filter(models.Accessory.accessory_id == accessory_id).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    existing = db.query(models.UserAccessory).filter(
        models.UserAccessory.user_id == user_id,
        models.UserAccessory.accessory_id == accessory_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="이미 보유 중입니다.")
    
    if user.cash < item.price:
        raise HTTPException(status_code=400, detail="캐시가 부족합니다.")
    
    user.cash -= item.price
    new_item = models.UserAccessory(user_id=user.id, accessory_id=item.accessory_id, is_active=False)
    
    db.add(new_item)
    db.commit()
    
    return {"message": f"{item.name} 구매 완료!", "remaining_cash": user.cash}

# 장착
@router.post("/{accessory_id}/equip")
def equip_accessory(
    accessory_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    
    my_item = db.query(models.UserAccessory).options(joinedload(models.UserAccessory.accessory)).filter(
        models.UserAccessory.user_id == user_id, 
        models.UserAccessory.accessory_id == accessory_id
    ).first()
    
    if not my_item:
        raise HTTPException(status_code=400, detail="구매하지 않은 아이템입니다.")
    
    item_type = my_item.accessory.type 

    # 같은 타입 해제
    active_items_of_same_type = db.query(models.UserAccessory).join(models.Accessory).filter(
        models.UserAccessory.user_id == user_id,
        models.UserAccessory.is_active == True,
        models.Accessory.type == item_type
    ).all()

    for item in active_items_of_same_type:
        item.is_active = False
    
    my_item.is_active = True
    db.commit()
    
    return {"message": "장착 완료!"}

# 해제
@router.post("/{accessory_id}/unequip")
def unequip_accessory(
    accessory_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    
    my_item = db.query(models.UserAccessory).filter(
        models.UserAccessory.user_id == user_id, 
        models.UserAccessory.accessory_id == accessory_id
    ).first()
    
    if not my_item:
        raise HTTPException(status_code=400, detail="보유하지 않은 아이템입니다.")
    
    my_item.is_active = False
    db.commit()
    
    return {"message": "장착 해제 완료!"}