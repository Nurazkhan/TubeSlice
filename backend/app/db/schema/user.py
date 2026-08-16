from pydantic import BaseModel, EmailStr
from typing import Union

class UserInSignUp(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str

class UserOutput(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    role: str

class UserInUpdate(BaseModel):
    id: str
    first_name: Union[str, None] = None
    last_name: Union[str, None] = None
    email: Union[EmailStr, None] = None
    password: Union[str, None] = None
    role: Union[str, None] = None

class UserInLogin(BaseModel):
    email: EmailStr
    password: str

class UserWithToken(BaseModel):
    token: str

class UserPayloadOut(BaseModel):
    id: str
    expires_at: int

