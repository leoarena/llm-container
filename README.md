# LLM Container

Docker container to isolate LLMs

## How to use

### 1. Build the image

UID and GID 1000 are used by default:

```bash
docker build --no-cache -t llm-container-image .
```

To match a host user with a different UID or GID, pass them when building:

```bash
docker build --no-cache \
  --build-arg USER_ID="$(id -u)" \
  --build-arg GROUP_ID="$(id -g)" \
  -t llm-container-image .
```

The UID and GID are fixed in the image. Rebuild it when using the image for a
host user with different IDs.

### 2. Prepare the persistent directories

Create the directories before starting the container so Docker does not create
them as root:

```bash
mkdir -p \
  ~/llm_container_volume/.codex \
  ~/llm_container_volume/.config/opencode \
  ~/llm_container_volume/.local
```

If these directories were previously used by the root-based image, migrate
their ownership once:

```bash
sudo chown -R "$(id -u):$(id -g)" ~/llm_container_volume
```

### 3. Start the container

```bash
docker run --rm -it \
  -v ~/llm_container_volume/.codex:/home/node/.codex \
  -v ~/llm_container_volume/.config/opencode:/home/node/.config/opencode \
  -v ~/llm_container_volume/.local:/home/node/.local \
  -v "$(pwd):/workspace" \
  --name llm-container \
  llm-container-image
```

### Add an alias for easier use

Add to ~/.bashrc

```bash
alias llm-container='docker run --rm -it \
  -v ~/llm_container_volume/.codex:/home/node/.codex \
  -v ~/llm_container_volume/.config/opencode:/home/node/.config/opencode \
  -v ~/llm_container_volume/.local:/home/node/.local \
  -v "$(pwd):/workspace" \
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
