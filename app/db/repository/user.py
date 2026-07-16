from .base import BaseRepository
from app.db.schema.user import UserInSignUp
from app.db.models.users import User

class UserRepository(BaseRepository):
    def create_user(self, userData: UserInSignUp):
        new_user = User(**userData.model_dump(exclude_none= True))
        self.session.add(instance = new_user)
        self.session.commit()
        self.session.refresh(instance=new_user)
        return new_user
    
    def user_exist_by_email(self, email: str)->bool:
        user = self.session.query(User).filter_by(email= email).first()
        return bool(user)
    
    def get_user_by_email(self, email:str) -> User:
        user = self.session.query(User).filter_by(email=email).first()
        return user
    def get_user_by_id(self, id:str) -> User:
        user = self.session.query(User).filter_by(id=id).first()
        return user
    
    def get_all_users(self) -> list[User]:
        users = self.session.query(User).all()
        return users
    
    