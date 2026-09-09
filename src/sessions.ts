import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const waitBuffer = new Int32Array(new SharedArrayBuffer(4));
function wait(milliseconds: number): void { Atomics.wait(waitBuffer, 0, 0, milliseconds); }

export class SessionRegistry {
  constructor(private readonly root = path.join(os.homedir(), ".llm-container", "sessions")) {}

  register(containerName: string, prepare: () => void, pid = process.pid): void {
    this.withLock(containerName, directory => {
      this.prune(directory);
      prepare();
      fs.writeFileSync(path.join(directory, String(pid)), String(Date.now()), { mode: 0o600 });
    });
  }

  unregister(containerName: string, onLast: () => void, pid = process.pid): void {
    this.withLock(containerName, directory => {
      fs.rmSync(path.join(directory, String(pid)), { force: true });
      this.prune(directory);
      if (this.sessionPids(directory).length === 0) onLast();
    });
  }

  clear(containerName: string): void {
    fs.rmSync(this.containerDirectory(containerName), { recursive: true, force: true });
  }

  private withLock<T>(containerName: string, action: (directory: string) => T): T {
    const directory = this.containerDirectory(containerName);
    const lock = `${directory}.lock`;
    fs.mkdirSync(this.root, { recursive: true, mode: 0o700 });
    let acquired = false;
    for (let attempt = 0; attempt < 200; attempt += 1) {
      try { fs.mkdirSync(lock); acquired = true; break; }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        wait(10);
      }
    }
    if (!acquired) throw new Error(`Could not lock session state for ${containerName}`);
    try {
      fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
      return action(directory);
    } finally {
      fs.rmSync(lock, { recursive: true, force: true });
    }
  }

  private prune(directory: string): void {
    for (const pid of this.sessionPids(directory)) {
      try { process.kill(pid, 0); }
      catch { fs.rmSync(path.join(directory, String(pid)), { force: true }); }
    }
  }

  private sessionPids(directory: string): number[] {
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory).filter(entry => /^\d+$/.test(entry)).map(Number);
  }

  private containerDirectory(containerName: string): string { return path.join(this.root, containerName); }
}
