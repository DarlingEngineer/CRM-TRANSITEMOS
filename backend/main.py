from fastapi import FastAPI
from modules.auth.api import router as auth_router
from modules.tickets.api import router as tickets_router
from core.security import get_current_user
from fastapi import Depends

app = FastAPI(title="CRM API")

app.include_router(auth_router)
app.include_router(tickets_router)

@app.get("/")
def health_check():
    return {"status": "ok"}


@app.get("/me")
def read_me(current_user: dict = Depends(get_current_user)):
    return current_user