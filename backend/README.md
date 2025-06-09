  cd backend
  docker build -t meu-backend:latest .
  docker run -d -p 8000:8000 meu-backend:latest

  ou caso python instalado local e queira testar as apis :

  python -m uvicorn main:app --reload 