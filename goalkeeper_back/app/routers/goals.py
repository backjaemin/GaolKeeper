from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.core.dependencies import get_current_user_info
from datetime import datetime, timedelta, date

router = APIRouter()

# 목표 추가하기
@router.post("/", response_model=schemas.GoalResponse)
def create_goal(
    goal: schemas.GoalCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    new_goal = models.Goal(
        title=goal.title,
        category=goal.category,
        period=goal.period,
        memo=goal.memo,
        user_id=user_id
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return new_goal

# 내 목표 조회하기
@router.get("/", response_model=list[schemas.GoalResponse])
def read_my_goals(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    goals = db.query(models.Goal).filter(models.Goal.user_id == user_id).all()
    return goals

# 목표 수정
@router.patch("/{goal_id}", response_model=schemas.GoalResponse)
def update_goal(
    goal_id: int,
    goal_update: schemas.GoalUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    target_goal = db.query(models.Goal).filter(
        models.Goal.goal_id == goal_id, 
        models.Goal.user_id == user_id
    ).first()

    if not target_goal:
        raise HTTPException(status_code=404, detail="목표를 찾을 수 없습니다.")

    update_data = goal_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(target_goal, key, value)

    db.commit()
    db.refresh(target_goal)
    return target_goal

# 목표 삭제
@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    target_goal = db.query(models.Goal).filter(
        models.Goal.goal_id == goal_id, 
        models.Goal.user_id == user_id
    ).first()

    if not target_goal:
        raise HTTPException(status_code=404, detail="목표를 찾을 수 없습니다.")

    db.delete(target_goal)
    db.commit()
    return {"message": "목표가 삭제되었습니다."}

# ---------------------------------------------------------
# 5. 목표 인증 (보상 로직 강화 버전 🚀)
# ---------------------------------------------------------
@router.post("/{goal_id}/check")
def check_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    
    # 유저 찾기
    user = db.query(models.User).filter(models.User.id == user_id).first()

    # 목표 찾기
    goal = db.query(models.Goal).filter(
        models.Goal.goal_id == goal_id, 
        models.Goal.user_id == user_id
    ).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # 날짜 비교 로직
    now = datetime.now()
    today = now.date()
    last_date = goal.last_verified_at.date() if goal.last_verified_at else None

    # 중복 인증 방지
    if last_date == today:
        raise HTTPException(status_code=400, detail="오늘은 이미 인증했습니다!")
    
    # 개별 목표 스트릭 계산
    if last_date == (today - timedelta(days=1)):
        goal.current_streak += 1 # 어제 했으면 +1
    else:
        goal.current_streak = 0 # 아니면 초기화


    # 1. 보상 항목을 담을 리스트 생성
    rewards_breakdown = []
    
    # 2. 기본 보상 계산
    base_cash = 100
    total_exp = 20
    is_first_of_today = False
    rewards_breakdown.append({"label": "목표 달성 기본 보상", "amount": base_cash})

    # 3. 유저 통합 스트릭 및 '오늘의 첫 인증' 판별
    last_user_date = user.last_check_date.date() if user.last_check_date else None

    if last_user_date != today:
        # ✅ 오늘 앱에서 처음으로 목표를 달성한 순간!
        is_first_of_today = True
        
        # 스트릭 업데이트 로직
        if last_user_date == (today - timedelta(days=1)):
            user.total_streak += 1
        else:
            user.total_streak = 1
        
        user.last_check_date = now

    # 4. 스트릭 보너스 계산
    streak_bonus = user.total_streak * 100
    if (streak_bonus > 0) and is_first_of_today:
        rewards_breakdown.append({"label": f"{user.total_streak}일 연속 달성 보너스", "amount": streak_bonus})

    # 5. 오늘의 첫 인증 보너스
    first_bonus = 0
    if is_first_of_today:
        first_bonus = 200
        rewards_breakdown.append({"label": "오늘의 첫 목표 달성 보너스", "amount": first_bonus})

    # 총액 계산
    total_cash = sum(item["amount"] for item in rewards_breakdown)



    # # 7일 연속 달성 대박 보너스 (선택 사항)
    # if goal.current_streak % 7 == 0:
    #     total_cash += 500
    #     total_exp += 100

    # 유저 지갑 업데이트
    user = db.query(models.User).filter(models.User.id == user_id).first()
    user.cash += total_cash
    user.exp += total_exp

    # 🆙 레벨업 체크 (예: 경험치가 100 넘으면 레벨업)
    is_level_up = False
    if user.exp >= 100:
        user.level += 1
        user.exp -= 100 # 경험치 소모
        is_level_up = True

    # 시간 갱신 및 저장
    goal.last_verified_at = now
    db.commit()
    db.refresh(goal)
    db.refresh(user) # 유저 정보도 갱신된 걸 가져와야 함

    # 프론트엔드로 보낼 응답 
    return {
        "message": "인증 성공!",
        "current_streak": goal.current_streak,
        "total_streak": user.total_streak, # 전체 스트릭 반환
        "rewards_breakdown": rewards_breakdown, # ✅ 상세 내역 리스트
        "gained_cash": total_cash,
        "gained_exp": total_exp,
        "total_cash": user.cash,
        "current_level": user.level,
        "is_level_up": is_level_up
    }
