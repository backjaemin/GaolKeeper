import jwt
import os
import shutil
from datetime import datetime
from typing import Dict, Optional
from collections import Counter

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.core.dependencies import get_current_user_info

# .env 파일에서 환경변수 로딩
from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

# 설정값 (환경변수에서 가져오고, 없으면 기본값 사용)
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"

# 사진 저장할 폴더 설정
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# 토큰 인증 설정 (auto_error=False: 토큰이 없어도 에러 안 내고 None 처리)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/kakao/url", auto_error=False)


#  게시글 작성 (사진 + 글) - 로그인 필수
@router.post("/", response_model=schemas.PostResponse)
def create_post(
    title: str = Form(...),
    content: str = Form(...),          # 텍스트는 Form으로 받음
    image: UploadFile = File(None),    # 파일은 File로 받음 (없을 수도 있음)
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info) # 글 쓸 땐 로그인 필수
):
    user_id = int(current_user["sub"])
    # --- 수정된 부분: 유저 DB에서 직접 닉네임 가져오기 ---
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다.")
    
    user_nickname = user.nickname # DB에서 가져온 진짜 닉네임

    image_url = None

    # 사진이 있다면 서버 폴더에 저장
    if image:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{image.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
            
        # DB에는 파일 경로(URL)만 저장
        image_url = f"/static/{filename}"

    # DB 저장
    new_post = models.BoardPost(
        title = title,
        content=content,
        image_url=image_url,
        user_id=user_id,
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return schemas.PostResponse(
        post_id=new_post.post_id,
        user_id=new_post.user_id,
        nickname=user.nickname, # 👈 저장된 값이 아니라, 유저 정보에서 가져온 값을 넣어줌
        title=new_post.title,
        content=new_post.content,
        image_url=new_post.image_url,
        created_at=new_post.created_at,
        reaction_counts={},
        my_reaction=None
    )


# 게시글 목록 조회 - 로그인 선택 (눈팅 가능)
@router.get("/", response_model=list[schemas.PostResponse])
def get_posts(
    skip: int = 0, 
    limit: int = 10, 
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme) # 토큰은 없으면 None
):
    # 토큰이 있다면 유저 ID 추출 (내가 누른 좋아요 확인용)
    current_user_id = None
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            current_user_id = int(payload.get("sub"))
        except:
            pass # 토큰이 만료됐거나 이상하면 그냥 로그인 안 한 사람 취급

    # 게시글 최신순 조회
    posts = db.query(models.BoardPost).order_by(models.BoardPost.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for post in posts:
        # 이 게시글의 모든 리액션 가져오기
        reactions = db.query(models.Reaction).filter(models.Reaction.post_id == post.post_id).all()
        
        # 이모지 종류별로 개수 세기 (예: {"👍": 2, "❤️": 1})
        counts = dict(Counter([r.emoji_type for r in reactions]))
        
        #  내가 누른 게 있는지 확인 (로그인 한 경우만)
        my_reaction = None
        if current_user_id:
            # 내 user_id로 된 리액션 찾기
            my_react_obj = next((r for r in reactions if r.user_id == current_user_id), None)
            if my_react_obj:
                my_reaction = my_react_obj.emoji_type

        # 결과 리스트에 추가
        result.append({
            "post_id": post.post_id,
            "user_id": post.user_id,
            "nickname": post.user.nickname if post.user else "알수없음",
            "title" : post.title,
            "content": post.content,
            "image_url": post.image_url,
            "created_at": post.created_at,
            "reaction_counts": counts, 
            "my_reaction": my_reaction 
        })
        
    return result

# [추가할 코드] 게시글 상세 조회 (글 1개 가져오기)
@router.get("/{post_id}", response_model=schemas.PostResponse)
def get_post(
    post_id: int, 
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
):
    # 1. 게시글 찾기
    post = db.query(models.BoardPost).filter(models.BoardPost.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")

    # 2. 좋아요 정보 계산
    reactions = db.query(models.Reaction).filter(models.Reaction.post_id == post.post_id).all()
    counts = dict(Counter([r.emoji_type for r in reactions]))
    
    my_reaction = None
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            current_user_id = int(payload.get("sub"))
            my_react_obj = next((r for r in reactions if r.user_id == current_user_id), None)
            if my_react_obj:
                my_reaction = my_react_obj.emoji_type
        except:
            pass

    # 3. 응답 데이터 조립 (닉네임 포함)
    return schemas.PostResponse(
        post_id=post.post_id,
        user_id=post.user_id,
        nickname=post.user.nickname if post.user else "알수없음",
        title=post.title,
        content=post.content,
        image_url=post.image_url,
        created_at=post.created_at,
        reaction_counts=counts,
        my_reaction=my_reaction
    )

# 이모지 반응 남기기 (추가/변경/취소) - 로그인 필수
@router.post("/{post_id}/react")
def react_to_post(
    post_id: int,
    request: schemas.ReactionRequest, # { "emoji": "🔥" }
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    emoji = request.emoji 
    
    # 게시글 존재 확인
    post = db.query(models.BoardPost).filter(models.BoardPost.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    # 이미 누른 반응이 있는지 확인
    existing_reaction = db.query(models.Reaction).filter(
        models.Reaction.post_id == post_id,
        models.Reaction.user_id == user_id
    ).first()
    
    if existing_reaction:
        # 경우 1: 같은 이모지를 또 누름 -> 취소 (삭제)
        if existing_reaction.emoji_type == emoji:
            db.delete(existing_reaction)
            db.commit()
            return {"message": "반응 취소", "action": "deleted"}
        
        # 경우 2: 다른 이모지를 누름 -> 변경 (업데이트)
        else:
            existing_reaction.emoji_type = emoji
            db.commit()
            return {"message": "반응 변경", "action": "updated", "emoji": emoji}
            
    else:
        # 경우 3: 처음 누름 -> 생성
        new_reaction = models.Reaction(
            post_id=post_id,
            user_id=user_id,
            emoji_type=emoji
        )
        db.add(new_reaction)
        db.commit()
        return {"message": "반응 추가", "action": "created", "emoji": emoji}

# 게시글 수정하기 (제목, 내용, 사진 변경) - 본인만 가능
@router.patch("/{post_id}", response_model=schemas.PostResponse)
def update_post(
    post_id: int,
    title: Optional[str] = Form(None),   # 수정할 때 제목을 안 보낼 수도 있어서 Optional
    content: Optional[str] = Form(None), # 내용도 마찬가지
    image: UploadFile = File(None),      # 사진도 바꿀 사람만 보냄
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    
    # 게시글 찾기
    post = db.query(models.BoardPost).filter(models.BoardPost.post_id == post_id).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
        
    # 권한 확인 (내 글인지?)
    if post.user_id != user_id:
        raise HTTPException(status_code=403, detail="본인의 게시글만 수정할 수 있습니다.")

    # 내용 수정 (보낸 값만 업데이트)
    if title:
        post.title = title
    if content:
        post.content = content
        
    # 사진 수정 로직 (사진을 새로 보냈다면?)
    if image:
        #  기존 파일 삭제 로직
        if post.image_url:
             old_file_path = post.image_url.replace("/static/", "")
             if os.path.exists(os.path.join(UPLOAD_DIR, old_file_path)):
                 os.remove(os.path.join(UPLOAD_DIR, old_file_path))
        
        # 새 파일 저장
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{image.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
            
        post.image_url = f"/static/{filename}"

    # DB 저장
    db.commit()
    db.refresh(post)
    post.nickname = post.user.nickname if post.user_id else "알수없음"
    
    # 응답을 위해 리액션 정보 채우기 (기존 정보 유지)
    reactions = db.query(models.Reaction).filter(models.Reaction.post_id == post.post_id).all()
    post.reaction_counts = dict(Counter([r.emoji_type for r in reactions]))
    
    my_react_obj = next((r for r in reactions if r.user_id == user_id), None)
    post.my_reaction = my_react_obj.emoji_type if my_react_obj else None
    
    return post



# 게시글 삭제하기 - 본인만 가능

@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_info)
):
    user_id = int(current_user["sub"])
    
    # 게시글 찾기
    post = db.query(models.BoardPost).filter(models.BoardPost.post_id == post_id).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
        
    # 권한 확인 (내 글인지?)
    if post.user_id != user_id:
        raise HTTPException(status_code=403, detail="본인의 게시글만 삭제할 수 있습니다.")
    
    if post.image_url:
        
        filename = post.image_url.replace("/static/", "")
        
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # 파일이 실제로 존재하는지 확인 후 삭제
        if os.path.exists(file_path):
            try:
                os.remove(file_path) # 파일 삭제
            except Exception as e:
                # 파일 삭제에 실패해도 DB 삭제는 진행되어야 하므로 에러 로그만 찍고 넘어감
                print(f"이미지 파일 삭제 실패: {e}")

    # DB 삭제 
    db.delete(post)
    db.commit()
    
    return {"message": "게시글이 삭제되었습니다."}