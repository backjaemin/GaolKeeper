from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from typing import Dict 

# 목표 
class GoalCreate(BaseModel):
    title: str
    category: str  
    period: str = "daily"
    memo: Optional[str] = None 

class GoalResponse(BaseModel):
    goal_id: int
    title: str
    category: str
    period: str
    is_completed: bool
    created_at: datetime

    current_streak: int 
    last_verified_at: Optional[datetime]
    class Config:
        from_attributes = True

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    period: Optional[str] = None
    memo: Optional[str] = None
    is_completed: Optional[bool] = None

# 게시글 (Board)
class PostCreate(BaseModel):
    title: str
    content: str

class PostResponse(BaseModel):
    title:str
    post_id: int
    user_id: int
    nickname: str
    content: str
    image_url: Optional[str] = None # 사진 주소 (없을 수도 있음)
    created_at: datetime
    
    reaction_counts: Dict[str, int] = {}  # 예: {"👍": 5, "❤️": 2}
    my_reaction: Optional[str] = None     # 내가 누른 이모지 (없으면 None)

    class Config:
        from_attributes = True
class SocialLoginRequest(BaseModel):
    token: str  # 앱이 카카오/구글 SDK에서 받아온 액세스 토큰


# --- 마스코트 (Mascot) ---
class MascotResponse(BaseModel):
    mascot_id: int
    name: str
    species: str
    description: Optional[str]
    image_url: Optional[str]
    price: int
    locked_image_url: Optional[str] = None
    type: str
    class Config:
        from_attributes = True

# 내가 가진 마스코트 정보
class UserMascotResponse(BaseModel):
    id: int  
    user_id: int         
    mascot_id: int
    mascot: MascotResponse  # 마스코트 상세 정보 포함
    is_active: bool
    acquired_at: datetime

    class Config:
        from_attributes = True
# app/schemas.py (맨 아래에 추가)

# --- 유저 (Users) ---

# 1. 내 정보 수정할 때 쓰는 양식
class UserUpdate(BaseModel):
    nickname: Optional[str] = None  
    email: Optional[str] = None

# 2. 유저 정보를 보여줄 때 쓰는 양식 (명함)
class UserResponse(BaseModel):
    id: int
    nickname: Optional[str]
    email: Optional[str]
    level: int
    exp: int
    cash: int
    provider: Optional[str]
    total_streak: int 
    last_check_date: Optional[datetime] 

    class Config:
        from_attributes = True


# 1. [신규] 이모지 반응 요청 양식
class ReactionRequest(BaseModel):
    emoji: str  # "👍", "❤️", "🔥" 등 이모지 문자 자체를 받음


# --- 장신구 (Accessory) ---
class AccessoryResponse(BaseModel):
    accessory_id: int
    name: str
    type: Optional[str]
    image_url: Optional[str]
    price: int

    class Config:
        from_attributes = True

class UserAccessoryResponse(BaseModel):
    id: int
    user_id: int
    accessory_id: int
    accessory: AccessoryResponse
    is_active: bool
    acquired_at: datetime

    class Config:
        from_attributes = True

