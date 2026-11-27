# Retiform plugins

Retiform is shared, governed memory for AI agents. This repository contains:

- **Retiform**, the portable package submitted to the universal Plugins Directory for ChatGPT, Codex, and compatible
  Agent Plugins hosts;
- **Retiform Codex lifecycle companion**, the same workflows plus trusted local lifecycle hooks. It is the only
  package installable from this Git marketplace.

For Codex lifecycle reminders, install the companion instead of the portable Retiform plugin. Do not install both:
the companion already includes the same MCP server and skills.

The public plugin connects to `https://api.retiform.ai/mcp` with OAuth Client ID Metadata Documents (CIMD), with
host-managed dynamic client registration as a compatibility fallback. Packages contain no credential, tenant
identifier, or reviewer account. Review lifecycle hooks before trusting the companion.

Product and setup documentation: https://retiform.ai/docs/agent-plugins/
