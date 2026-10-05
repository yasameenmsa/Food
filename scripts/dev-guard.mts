import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, readlinkSync, existsSync } from "node:fs";
import { join } from "node:path";

const port = Number(process.env.PORT ?? 3000);
const self = process.cwd();

type Listener = { pid: number; cwd: string | null; cmd: string };

function listeningInodes(port: number): Set<string> {
  const inodes = new Set<string>();
  for (const file of ["/proc/net/tcp", "/proc/net/tcp6"]) {
    let lines: string[];
    try {
      lines = readFileSync(file, "utf8").split("\n").slice(1);
    } catch {
      continue;
    }
    for (const line of lines) {
      if (!line.trim()) continue;
      const cols = line.trim().split(/\s+/);
      if (cols[3] !== "0A") continue;
      const localPort = Number.parseInt(cols[1].split(":")[1], 16);
      if (localPort === port) inodes.add(cols[9]);
    }
  }
  return inodes;
}

function processCmd(pid: number): string {
  try {
    return execFileSync("ps", ["-o", "cmd=", "-p", String(pid)], { encoding: "utf8" });
  } catch {
    return "";
  }
}

function listenersOn(port: number): Listener[] {
  const inodes = listeningInodes(port);
  if (inodes.size === 0) return [];

  const found: Listener[] = [];
  for (const entry of readdirSync("/proc")) {
    if (!/^\d+$/.test(entry)) continue;
    const pid = Number(entry);
    let fds: string[];
    try {
      fds = readdirSync(`/proc/${pid}/fd`);
    } catch {
      continue;
    }
    for (const fd of fds) {
      let target: string;
      try {
        target = readlinkSync(`/proc/${pid}/fd/${fd}`);
      } catch {
        continue;
      }
      const match = /^socket:\[(\d+)\]$/.exec(target);
      if (!match || !inodes.has(match[1])) continue;
      let cwd: string | null = null;
      try {
        cwd = readlinkSync(`/proc/${pid}/cwd`);
      } catch {
        cwd = null;
      }
      found.push({ pid, cwd, cmd: processCmd(pid) });
      break;
    }
  }
  return found;
}

function isNextServer(cmd: string): boolean {
  return /next-server|next dev|next start/.test(cmd);
}

function serviceWorkerCacheExists(): boolean {
  const base = join(
    process.env.HOME ?? "",
    ".config/Code/Partitions/vscode-browser/Service Worker",
  );
  return existsSync(base);
}

const occupied = listenersOn(port);

for (const listener of occupied.filter((l) => isNextServer(l.cmd))) {
  if (listener.cwd === self) {
    console.log(
      `[dev-guard] a dev server for this project already owns :${port} (pid ${listener.pid}).`,
    );
    console.log("[dev-guard] stop it first, otherwise next dev refuses to start.");
    process.exit(1);
  }

  console.log(`[dev-guard] :${port} is held by a next server from another project:`);
  console.log(`[dev-guard]   pid ${listener.pid} -> ${listener.cwd ?? "unknown"}`);
  try {
    process.kill(listener.pid, "SIGTERM");
    console.log(`[dev-guard] stopped pid ${listener.pid}`);
  } catch {
    console.log(`[dev-guard] could not stop pid ${listener.pid}; stop it manually`);
  }
}

const foreign = occupied.filter((l) => !isNextServer(l.cmd));
if (foreign.length > 0) {
  console.log(
    `[dev-guard] :${port} is held by a non-next process (pid ${foreign[0].pid}); next dev will use another port.`,
  );
}

if (serviceWorkerCacheExists()) {
  console.log(
    "[dev-guard] warning: a VS Code Simple Browser service worker cache exists for this origin.",
  );
  console.log("[dev-guard] if the browser shows an old project, run: pnpm dev:clear-sw");
}