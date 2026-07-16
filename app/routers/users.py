from fastapi import APIRouter, Depends
from app.db.schema.user import UserOutput
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.service.user_service import UserService

users_router = APIRouter()

@users_router.get('/users')
def all_users(session: Session = Depends(get_db))-> list[UserOutput] | dict[str, str]:
    users = UserService(session=session).get_all_users()
    if users:
        return [UserOutput(
                id= user.id,
                first_name=user.first_name,
                last_name= user.last_name,
                email=user.email,
                isAdmin= user.isAdmin
            ) for user in users]
    else:
        return {'message': 'there are no users in database'}
