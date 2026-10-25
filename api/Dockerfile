# Build from the repo root:  docker build -f api/Dockerfile -t als-voice-api .
# Same Python version as training, so the saved model unpickles cleanly.

FROM python:3.14-slim AS build
# praat-parselmouth may need compiling when no prebuilt wheel exists for this CPU.
RUN apt-get update && apt-get install -y --no-install-recommends build-essential cmake ninja-build \
    && rm -rf /var/lib/apt/lists/*
COPY api/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir --prefix=/install -r /tmp/requirements.txt

FROM python:3.14-slim
# ffmpeg decodes Android .m4a recordings; libsndfile reads WAV.
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libsndfile1 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /install /usr/local

WORKDIR /srv
COPY ml/features.py ml/features.py
COPY ml/models/model.joblib ml/models/model.joblib
COPY api/main.py api/main.py

ENV PORT=8000
CMD uvicorn api.main:app --host 0.0.0.0 --port ${PORT}
