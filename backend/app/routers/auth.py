from fastapi import APIRouter, Depends
from app.db.schema.user import UserInLogin, UserOutput, UserWithToken, UserInSignUp
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.service.user_service import UserService
router = APIRouter()

@router.post('/login', response_model= UserWithToken)
def login(payload: UserInLogin, session: Session = Depends(get_db)) -> UserWithToken:
    try:
        return UserService(session).login(payload)
    except Exception as error:
        print(error)
        raise error
    

@router.post('/signup', response_model=UserOutput)
def signUp(payload: UserInSignUp, session: Session = Depends(get_db)) -> UserOutput:
    try:
        return UserService(session).signUp(payload)
    except Exception as error:
        print(error)
        raise error