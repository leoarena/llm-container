FROM node:24-slim

ENV TZ=America/Sao_Paulo \
    HOME=/home/node \
    PATH=/home/node/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    git \
    php-cli \
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
    printf '%s\n' "export PS1='\\[\\033[01;32m\\]node@llm-container\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ '" >> /home/node/.bashrc; \
    printf '%s\n' 'export PATH="/home/node/.local/bin:$PATH"' >> /home/node/.profile; \
    chown -R node:node /home/node

WORKDIR /home/node

USER node

RUN uv python install --default

RUN uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

CMD ["bash"]
