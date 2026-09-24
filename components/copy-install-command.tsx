"use client"

import { Copy } from "lucide-react"
import { useRef, useState } from "react"

import styles from "@/app/start/start.module.css"

export function CopyInstallCommand({ commands }: { commands: string }) {
  const copying = useRef(false)
  const [status, setStatus] = useState<"idle" | "copying" | "copied" | "failed">("idle")

  async function copyCommands() {
    if (copying.current) return
    copying.current = true
    setStatus("copying")
    try {
      await navigator.clipboard.writeText(commands)
      setStatus("copied")
    } catch {
      setStatus("failed")
    } finally {
      copying.current = false
    }
  }

  return (
    <div className={styles.commandPanel}>
      <div className={styles.commandBar}>
        <label htmlFor="local-install-commands">Local installation commands</label>
        <button
          type="button"
          className={styles.copyButton}
          onClick={copyCommands}
          aria-disabled={status === "copying"}
          aria-describedby="copy-command-status"
        >
          <Copy size={16} aria-hidden="true" />
          Copy commands
        </button>
      </div>
      <textarea
        id="local-install-commands"
        className={styles.commands}
        value={commands}
        readOnly
        rows={6}
        spellCheck={false}
        autoCapitalize="off"
      />
      <p id="copy-command-status" className={styles.copyStatus} role="status" aria-atomic="true">
        {status === "copying" ? "Copying…" : status === "copied" ? "Copied. Paste into your terminal when ready." : status === "failed" ? "Copy unavailable. Select the commands above and copy them manually." : "Commands are selectable if you prefer to copy them yourself."}
      </p>
    </div>
  )
}
