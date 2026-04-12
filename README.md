# LLM Container

Docker container to isolate LLMs

## How to use

### 1. Build the image

```bash
docker build -t llm-container-image .
```

### 2. Start the container

```bash
docker run --rm -it \
-v ~/llm_container_volume/.codex:/root/.codex \
-v ~/llm_container_volume/.config/opencode:/root/.config/opencode \
-v ~/llm_container_volume/.local:/root/.local \
-v $(pwd):/workspace \
--name llm-container \
llm-container-image
```

### Add an alias for easier use

Add to ~/.bashrc

```
alias llm-container='docker run --rm -it \
-v ~/llm_container_volume/.codex:/root/.codex \
-v ~/llm_container_volume/.config/opencode:/root/.config/opencode \
-v ~/llm_container_volume/.local:/root/.local \
-v $(pwd):/workspace \
--name llm-container \
llm-container-image'
```

### Start llm-container

```bash
cd project/directory
llm-container
```

Start opencode directly

```bash
llm-container opencode
```

Start codex directly

```bash
llm-container codex
```
