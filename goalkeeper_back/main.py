from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.routers import auth, goals, community, users,accessories,mascots
from app import models

Base.metadata.create_all(bind=engine) 

app = FastAPI()
def init_db():
    db = SessionLocal()
    try:
        # 마스코트 데이터 확인 및 생성
        if db.query(models.Mascot).count() == 0:
            print("🚀 마스코트 데이터가 없어서 기본 데이터를 생성합니다...")
            mascots_data = [
                models.Mascot(name="짜근 하먀", species="하마", description="악어랑 하마랑 싸우면 누가 이길까요?", price=0, image_url="/static/액세서리용_하마.png",locked_image_url="액세서리용_하마.png"),
                models.Mascot(name="고얌이", species="고양이", description="엣취", price=0, image_url="/static/고얌이.png",locked_image_url="/static/노고얌이.png"),
                models.Mascot(name="겁욱이", species="거북이", description="거북이가 죽으면 먼저 가있던 반려사람이 마중나온다는 얘기가 있다 나는 이 이야기를 무척 좋아한다", price=0, image_url="/static/겁욱이.png", locked_image_url="/static/노겁욱이.png"),
                models.Mascot(name="갱쥐", species="개", description="겨울이라 군고구마 많이 먹었어요", price=0, image_url="/static/갱쥐.png", locked_image_url="/static/노갱쥐.png")
            ]
            db.add_all(mascots_data)
            db.commit()
            print("✅ 마스코트 생성 완료!")

        # 액세서리 데이터 확인 및 생성
        if db.query(models.Accessory).count() == 0:
            print("🚀 액세서리 데이터가 없어서 기본 데이터를 생성합니다...")
            accessories_data = [
                models.Accessory(name="봄", type="background", price=0, image_url="/static/봄.png"),
                models.Accessory(name="여름", type="background", price=0, image_url="/static/여름.png"),
                models.Accessory(name="가을", type="background", price=0, image_url="/static/가을.png"),
                models.Accessory(name="겨울", type="background", price=0, image_url="/static/겨울.png"),
                models.Accessory(name="비니", type="head", price=0, image_url="/static/비니.png"),
                models.Accessory(name="초롱눈", type="face", price=0, image_url="/static/초롱눈.png"),
                models.Accessory(name="금목걸이", type="neck", price=0, image_url="/static/금목걸이.png"),
                models.Accessory(name="방", type="background", price=0, image_url="/static/방.png"), # 기본 무료
                models.Accessory(name="메로나 하마", type="body", price=0, image_url="/static/메로나하마.png")
            ]
            db.add_all(accessories_data)
            db.commit()
            print("✅ 액세서리 생성 완료!")
            
    except Exception as e:
        print(f"❌ 데이터 초기화 중 오류 발생: {e}")
    finally:
        db.close()

# 서버 켜질 때 함수 실행
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(goals.router, prefix="/goals", tags=["Goals"])
app.include_router(community.router, prefix="/community", tags=["Community"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(mascots.router, prefix="/mascots", tags=["Mascots"])
app.include_router(accessories.router, prefix="/accessories", tags=["Accessories"])
@app.get("/")
def read_root():
    return {"message": "Goal Keeper Server Running!"}