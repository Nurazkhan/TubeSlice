from sqlalchemy.orm import Session
from fastapi import Depends,  HTTPException, status
from app.config.database import get_db
from typing import Annotated
from app.db.schema.user import UserOutput
from app.config.security.authHandler import AuthHandler
from app.service.user_service import UserService
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


security_scheme = HTTPBearer()

def get_current_user(session: Session = Depends(get_db), authorization: Annotated[HTTPAuthorizationCredentials, Depends(security_scheme)] = None) -> UserOutput:
    auth_exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Authorization error')

    if not authorization:
        raise auth_exc
    
    token = authorization.credentials
    
    payload = AuthHandler.decode_jwt(token = token)

    if payload and payload['user_id']:
        try:
            user = UserService(session).get_user_by_id(id = payload['user_id'])
            return UserOutput(
                id= user.id,
                first_name=user.first_name,
                last_name= user.last_name,
                email=user.email,
                isAdmin= user.isAdmin
            )
        except Exception as error:
            print(error)
            raise(error)
    raise auth_exc