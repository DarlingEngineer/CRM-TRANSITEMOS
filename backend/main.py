from fastapi import FastAPI

app = FastAPI(title="CRM API")

@app.get("/")
def health_check():
    return {"status": "ok"}