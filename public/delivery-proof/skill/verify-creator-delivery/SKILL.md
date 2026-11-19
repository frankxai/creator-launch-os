---
name: verify-creator-delivery
description: Compare a downloaded Creator Launch OS ZIP or one extracted member with the owner's package receipt and produce a reproducible handoff record.
---

Use the receipt obtained from a trusted source and the recipient's actual local file. Read only the two paths the recipient supplies. The comparison does not authorize access, execute archive contents, or evaluate license or payment facts.

Run Python 3 with verify.py from this skill directory, followed by the receipt path, the delivered file path, and optionally --member plus the exact case-sensitive receipt path. Preserve stdout and the exit code. A renamed download can match its original bytes. Do not use a path from the receipt to locate files automatically.

For a mismatch, report the edition, expected and actual size and SHA-256. Preserve the first download and retry from the authorized delivery route. If bytes match, ask the receiver to open the artifact and complete the promised task. Record their outcome separately.

For installation copy this directory, including verify.py, into the receiving project's .agents/skills/ (Codex) or .claude/skills/ (Claude Code). Restart or reopen the project to discover the skill. The command also runs directly without an agent.
