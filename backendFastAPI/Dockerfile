# Imagen del backend FastAPI para Render (quinto avance, requisito 20).
# La base de datos es externa (MySQL en Aiven); aquí solo corre la API.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Las dependencias van en su propia capa para no reinstalarlas en cada cambio de código.
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app
COPY database ./database

RUN useradd --create-home --uid 10001 beautylux
USER beautylux

# Render inyecta PORT; 8000 es el valor local por defecto.
ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
