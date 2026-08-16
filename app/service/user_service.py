from sqlalchemy.orm import Session
from app.db.repository.user import UserRepository
from app.db.schema.user import UserInLogin, UserInSignUp, UserOutput, UserWithToken
from app.db.models.users import User
from fastapi import HTTPException, status
from app.config.security.hashHandler import HashHandler
from app.config.security.authHandler import AuthHandler

class UserService:
    def __init__(self, session: Session):
        self.__userRepository = UserRepository(session= session)

    def signUp(self, payload: UserInSignUp)-> UserOutput:
        if self.__userRepository.user_exist_by_email(payload.email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User with this email already created")
        hashed_pw = HashHandler.gen_password_hash(payload.password)
        payload.password = hashed_pw
       
        return self.__userRepository.create_user(payload)
    
    def login(self, payload: UserInLogin) -> UserWithToken:
        if not self.__userRepository.user_exist_by_email(payload.email):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User With this email not registered')
        user = self.__userRepository.get_user_by_email(payload.email)

        if HashHandler.verify_pw(payload.password, user.password):
            token = AuthHandler.sign_jwt(user.id)
            if token:
                return UserWithToken(token= token)
            else:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail= 'JWT token generation error')
        else:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='password incorrect')

        
    def get_user_by_id(self, id:str)-> User:
        user = self.__userRepository.get_user_by_id(id)
        if user:
            return user
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f'user with id: {id} not found')
    
    def get_all_users(self) -> list[User]:
        users = self.__userRepository.get_all_users()
        return users
    
    def delete_user_by_id(self, id:str)-> UserOutput:
        user = self.__userRepository.delete_user_by_id(id)
        return UserOutput(
            id= user.id,
                first_name=user.first_name,
                last_name= user.last_name,
                email=user.email,
                role= user.role)