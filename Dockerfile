FROM node:24-slim

ENV TZ=America/Sao_Paulo

RUN apt update && apt install -y --no-install-recommends \
    curl \
    ca-certificates \
    git \
    python3 \
    && rm -rf /var/lib/apt/lists/*

RUN npm i -g opencode-ai && \
    npm i -g @openai/codex

WORKDIR /workspace

CMD ["bash"]
