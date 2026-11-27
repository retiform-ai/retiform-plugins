# Retiform Codex lifecycle companion

This manually installed Codex plugin contains the portable Retiform workflows and five trusted lifecycle hooks.
Install it from a trusted local or Git marketplace, then use `/hooks` to review and trust the Retiform hooks. It is
not eligible for the public plugin directory because directory packages cannot contain lifecycle hooks.
Install it instead of the portable Retiform plugin, not alongside it: this companion already includes the same MCP
server and skills.

The hooks make no network calls and bundle no credential:

- `SessionStart` adds the Project recall instruction at startup and restores it after compaction.
- `UserPromptSubmit` reminds Codex to retrieve settled team context before acting.
- `PostToolUse` stores the identifier returned when this session records or updates a handoff.
- `PreCompact` confirms that the tracked identifier will be used after compaction.
- `SessionEnd` removes only the ended session's local instruction and handoff markers.

Authentication always uses the host's Retiform connection. Never put a token in this plugin directory.
