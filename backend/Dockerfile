# Atoms Demo Backend
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN chmod +x entrypoint.sh

ENV DATABASE_URL=sqlite:///./atoms_demo.db
EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]
