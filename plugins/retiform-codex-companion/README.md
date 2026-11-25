# Retiform universal plugin

This is the portable public Retiform plugin for ChatGPT, Codex, and compatible Agent Plugins hosts. It connects to
Retiform's production remote MCP server with OAuth dynamic client registration and adds workflows for decisions,
findings, handoffs, session write summaries, and approved document imports.

The public package deliberately has no lifecycle hooks. Run `npm run release` to create both its public archive and
the separately named manual Codex lifecycle companion archive. Run `node release.mjs --repository <empty-directory>`
to build the neutral Git marketplace tree containing both packages. Review fixtures and reviewer instructions stay
out of every published artifact.

For local development, add this repository as a Codex plugin marketplace or place the plugin under a local
marketplace path, then install it through the ChatGPT desktop Plugins Directory. Authentication always happens
through the host's connection flow; no credential belongs in this directory.

## Install and authenticate

- **ChatGPT Work and supported web/cloud surfaces:** install Retiform from the universal Plugins Directory, select
  Connect, and finish Retiform's browser sign-in and agent approval. Run the setup skill and choose a Project when
  the conversation has no repository link.
- **Codex desktop:** use the same public plugin for the base workflows. For automatic lifecycle reminders, add the
  companion archive to a trusted local or Git marketplace, install it instead of the hook-free package, review its
  hooks, and trust them in `/hooks`.
- **Codex CLI:** install from a supported marketplace when available. On an older host, use `codex mcp add retiform
  --url https://api.retiform.ai/mcp`, `codex mcp login retiform`, then `kg codex install` for the compatibility hook.

Codex cloud may expose a checked-out `.retiform/project.json`; ChatGPT web conversations do not implicitly have a
local repository. The setup workflow verifies a visible link and otherwise asks for Project scope. Imports on web
surfaces are limited to files the user provides.

## Update or remove

Upgrade a marketplace install through the host's Plugins Directory or `codex plugin marketplace upgrade`. Re-review
local hooks when Codex asks after an update. To remove Retiform, uninstall the plugin in the same directory UI and
disconnect its Retiform connection. Remove a local marketplace with `codex plugin marketplace remove <name>` only
when no other plugin depends on that marketplace.

The public plugin remains useful if hooks are unavailable, disabled, untrusted, or fail. A lifecycle handoff is
durable memory, not proof that another agent received or accepted work.
