import jwt
from decouple import config
import time
from app.db.schema.user import UserPayloadOut

JWT_SECRET = config('JWT_SECRET')
JWT_ALGORITHM = config('JWT_ALGORITHM')

class AuthHandler(object):

    @staticmethod
    def sign_jwt(user_id: str) -> str:
        payload = {
            'user_id': user_id,
            'expires_at': time.time() + 900
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm= JWT_ALGORITHM)
        return token
    
    @staticmethod
    def decode_jwt(token: str) ->UserPayloadOut | None:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload if payload['expires_at'] > time.time() else None
        except:
            print('unable to decode')
            return None