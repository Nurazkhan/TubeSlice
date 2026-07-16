from bcrypt import checkpw, hashpw, gensalt

class HashHandler(object):
    
    @staticmethod
    def verify_pw(plain_pw: str, hashed_pw: str)-> bool:
        return checkpw(plain_pw.encode('utf-8'), hashed_pw.encode('utf-8'))
    
    @staticmethod
    def gen_password_hash(plain_pw: str) -> str:
        hashed_pw = hashpw(plain_pw.encode('utf-8'), gensalt())
        return hashed_pw.decode('utf-8')
    