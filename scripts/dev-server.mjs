import { spawn } from "node:child_process"
import { cleanDevArtifacts } from "./clean-dev-cache.mjs"

cleanDevArtifacts()

const env = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: "1",
  WATCHPACK_POLLING: process.env.WATCHPACK_POLLING || "true",
}

const child = spawn("npx", ["next", "dev"], {
  stdio: "inherit",
  shell: true,
  env,
})

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
