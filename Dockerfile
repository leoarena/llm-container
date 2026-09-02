FROM node:24-slim

ENV TZ=America/Sao_Paulo \
    HOME=/home/node

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    git \
    php-cli \
    python3 \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

RUN npm i -g opencode-ai && \
    npm i -g @openai/codex

ARG USER_ID=1000
ARG GROUP_ID=1000

RUN set -eux; \
    test "$USER_ID" -gt 0; \
    test "$GROUP_ID" -gt 0; \
    if [ "$(id -g node)" != "$GROUP_ID" ]; then groupmod --gid "$GROUP_ID" node; fi; \
    if [ "$(id -u node)" != "$USER_ID" ]; then usermod --uid "$USER_ID" node; fi; \
    mkdir -p /workspace; \
    chown -R node:node /home/node /workspace

WORKDIR /workspace

USER node

CMD ["bash"]
