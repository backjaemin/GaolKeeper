from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.core.config import settings

# 토큰 입력창
security = HTTPBearer()

def get_current_user_info(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials 
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # 토큰 해석
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        user_id: str = payload.get("sub")
        username: str = payload.get("username")

        if user_id is None:
            raise credentials_exception
            
        return {"sub": user_id, "username": username}
        
    except JWTError:
        raise credentials_exception