// Starts the local blog editor and opens it in the browser: `pnpm write`
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const port = process.env.WRITER_PORT ?? "4321";
const url = `http://127.0.0.1:${port}/write/`;
const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");

// Bind to 127.0.0.1 so nobody else on the network can reach an editor that can push to GitHub.
const server = spawn(process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1", "--port", port], {
  env: { ...process.env, BLOG_WRITER: "1" },
  stdio: "inherit",
});

server.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}

function openBrowser(target) {
  const [command, args] =
    process.platform === "darwin"
      ? ["open", [target]]
      : process.platform === "win32"
        ? ["cmd", ["/c", "start", "", target]]
        : ["xdg-open", [target]];
  spawn(command, args, { stdio: "ignore", detached: true }).unref();
}

// Wait until the editor page has compiled, then open it.
for (let attempt = 0; attempt < 180; attempt += 1) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      console.log(`\n  ✎ Writer ready at ${url}  (Ctrl+C to stop)\n`);
      openBrowser(url);
      break;
    }
  } catch {
    // Server still starting.
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
