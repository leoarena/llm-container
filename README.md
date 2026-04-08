# OpenCode

Docker container to isolate LLMs

## How to use

### 1. Build the image

```bash
docker build -t llm-container-image .
```

### 2. Start the container

```bash
docker run --rm -it \
-v codex_volume:/root/.codex \
-v ~/opencode_volume/.config/opencode:/root/.config/opencode \
-v ~/opencode_volume/.local:/root/.local \
-v $(pwd):/workspace \
--name llm-container \
llm-container-image
```

### Add an alias for easier use

Add to ~/.bashrc

```
alias llm-container='docker run --rm -it \
-v codex_volume:/root/.codex \
-v ~/opencode_volume/.config/opencode:/root/.config/opencode \
-v ~/opencode_volume/.local:/root/.local \
-v $(pwd):/workspace \
--name llm-container \
llm-container-image'
```
