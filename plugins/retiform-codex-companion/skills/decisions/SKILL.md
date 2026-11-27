---
name: decisions
description: List decisions and other Retiform entries written in this conversation, including their identifiers. Use when the user asks what this agent recorded or changed.
---

# List this conversation's writes

Use only the successful `record_memory` and `supersede_memory` results already present in this conversation. Do not
query Retiform and imply that another conversation's writes came from this one.

For each write in order, show its label (`decision`, `finding`, or `handoff`), whether it was recorded or superseded,
its statement, its entry identifier, and the identifier it replaced when applicable. If the user asks for older
versions, call `get_memory_history`. If this conversation wrote nothing, say so in one line.
