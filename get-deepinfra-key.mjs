import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import process from "node:process"
import { DatabaseSync } from "node:sqlite"

const providerId = "a01d286f-77e6-4a30-a6c4-a86b09c26691"
const providerName = "DeepInfra DeepSeek"
const configuredKeyPath = join(
  process.env.OMO_CODING_AGENT_DIR || join(homedir(), ".omo", "agent"),
  "deepinfra-api-key",
)

function candidateDatabases() {
  const home = homedir()
  const appData = process.env.APPDATA
  return [
    process.env.CC_SWITCH_DB,
    join(home, ".cc-switch", "cc-switch.db"),
    appData && join(appData, "cc-switch", "cc-switch.db"),
    join(home, "AppData", "Roaming", "cc-switch", "cc-switch.db"),
  ].filter(Boolean)
}

function readTokenFromDatabase() {
  for (const path of candidateDatabases()) {
    if (!existsSync(path)) continue
    const db = new DatabaseSync(path, { readOnly: true })
    try {
      const row = db.prepare(
        "SELECT settings_config FROM providers WHERE id = ? OR name = ? LIMIT 1",
      ).get(providerId, providerName)
      if (!row?.settings_config) continue
      const settings = JSON.parse(row.settings_config)
      const token = settings?.env?.ANTHROPIC_AUTH_TOKEN
      if (typeof token === "string" && token.length > 0) return token
    } finally {
      db.close()
    }
  }
  return undefined
}

const token =
  process.env.DEEPINFRA_API_KEY ||
  (existsSync(configuredKeyPath) ? readFileSync(configuredKeyPath, "utf8").trim() : undefined) ||
  readTokenFromDatabase()
if (!token) {
  console.error("DeepInfra API key not found")
  process.exitCode = 1
} else {
  process.stdout.write(token)
}
