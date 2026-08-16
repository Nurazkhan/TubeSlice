from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
from app.util.init_db import create_tables
from app.routers.auth import router
from app.db.schema.user import UserOutput
from app.util.protect_route import get_current_user
from app.routers.users import users_router
from app.routers.download import download_router
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield

app = FastAPI(lifespan= lifespan)
origins  = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials = True,
    allow_methods =["*"],
    allow_headers = ["*"]
)

app.include_router(router)
app.include_router(users_router)
app.include_router(download_router)
@app.get('/')
def home():
    return {'message': 'hello world! \n it is Tube Slice!'}

#logged users only
@app.get('/dashboard')
def dashboard(user: UserOutput = Depends(get_current_user)):
    return {'data': f'hi logged in user! here is your data: {user}'}




if __name__ == '__main__':
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
