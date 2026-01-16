# app/models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# --- 유저 (Users) ---
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(100), nullable=False)      
    email = Column(String(255), unique=True, index=True) 

    # 💎 통합 스트릭 시스템
    total_streak = Column(Integer, default=0) # 앱 전체 연속 달성 횟수
    last_check_date = Column(DateTime(timezone=True), nullable=True) # 마지막 인증 날짜
    
    # 💎 성장 및 재화 시스템
    level = Column(Integer, default=1)
    exp = Column(Integer, default=0)
    cash = Column(Integer, default=0) # 👈 [NEW] 재화 (코인) 추가 완료!
    
    # 소셜 로그인 정보
    provider = Column(String(50))     
    provider_id = Column(String(255), unique=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    goals = relationship("Goal", back_populates="user", cascade="all, delete")
    posts = relationship("BoardPost", back_populates="user", cascade="all, delete")
    mascots = relationship("UserMascot", back_populates="user", cascade="all, delete")
    reactions = relationship("Reaction", back_populates="user", cascade="all, delete")
    total_streak = Column(Integer, default=0) # 앱 전체 연속 달성 횟수
    last_check_date = Column(DateTime(timezone=True), nullable=True) # 마지막 인증 날짜
class Goal(Base):
    __tablename__ = "goal"

    goal_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    title = Column(String(255), nullable=False)
    period = Column(String(20), default='daily') # daily, weekly, yearly
    category = Column(String(50), nullable=False) # 학업, 운동 등
    memo = Column(Text, nullable=True)           
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=True)
    is_completed = Column(Boolean, default=False)

    current_streak = Column(Integer, default=0)
    last_verified_at = Column(DateTime(timezone=True), nullable=True)
    user = relationship("User", back_populates="goals")


# --- 게시판 (BoardPost) ---
class BoardPost(Base):
    __tablename__ = "board_post"

    post_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="posts")
    reactions = relationship("Reaction", back_populates="post")


# --- 반응/이모지 (Reaction) ---
class Reaction(Base):
    __tablename__ = "reaction"

    reaction_id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("board_post.post_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    emoji_type = Column(String(50), nullable=False) # like, heart, fire

    post = relationship("BoardPost", back_populates="reactions")
    user = relationship("User", back_populates="reactions")


# --- 마스코트 도감 (Mascot) ---
class Mascot(Base):
    __tablename__ = "mascot"

    mascot_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    species = Column(String(100)) 
    description = Column(Text)
    image_url = Column(String(500))
    price = Column(Integer, default=100)
    locked_image_url = Column(String(255), nullable=True) 

    type = Column(String(50), default="body")

# --- 유저 마스코트 보유 현황 (UserMascot) ---
class UserMascot(Base):
    __tablename__ = "user_mascot"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mascot_id = Column(Integer, ForeignKey("mascot.mascot_id"), nullable=False)
    
    acquired_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True) # 현재 장착 중?

    user = relationship("User", back_populates="mascots")
    mascot = relationship("Mascot")

# --- 장신구 상점 (Accessory) ---
class Accessory(Base):
    __tablename__ = "accessory"

    accessory_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50)) # head(모자), face(안경), hand(도구) 등 구분용
    image_url = Column(String(500))
    price = Column(Integer, default=50)

# --- 유저 장신구 보유 현황 (UserAccessory) ---
class UserAccessory(Base):
    __tablename__ = "user_accessory"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    accessory_id = Column(Integer, ForeignKey("accessory.accessory_id"), nullable=False)
    
    acquired_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=False) # 현재 착용 중?

    user = relationship("User")
    accessory = relationship("Accessory")


# --- 알림 (Notifications) ---
class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    goal_id = Column(Integer, ForeignKey("goal.goal_id"), nullable=True)
    
    type = Column(String(50), nullable=False) # wake_up, friend_request
    message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_read = Column(Boolean, default=False)


# --- 알림 차단 (NotificationBlock) ---
class NotificationBlock(Base):
    __tablename__ = "notification_block"

    block_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notification_type = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
