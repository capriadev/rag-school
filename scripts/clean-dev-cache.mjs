import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const targets = [".next", "dist"]

for (const target of targets) {
  const fullPath = path.join(root, target)

  if (!fs.existsSync(fullPath)) {
    continue
  }

  fs.rmSync(fullPath, {
    recursive: true,
    force: true,
    maxRetries: 3,
    retryDelay: 150,
  })

  console.log(`Removed ${target}`)
}
