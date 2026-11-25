---
name: setup
description: Connect Retiform and verify the current tenant and Projects. Use after installation, when authentication fails, or when the user asks to set up Retiform.
---

# Set up Retiform

Use the bundled Retiform MCP connection. If it is not authenticated, ask the host to start its Retiform connection
flow and let the user sign in and approve this agent. Never ask the user to paste a token.

After authentication, call `query_entities` with `types` set to `["Project"]`. Name the tenant and the Projects the
connection can read. Do not create a Project or choose one silently.

If the host exposes the local repository, look for `.retiform/project.json`. Treat its Project identifier as a hint:
verify that it is one of the returned Projects before using it. In a chat without repository access, ask which
Project applies only when Project scope is needed. Tenant-wide work needs no Project.

Explain in one line that Retiform shares durable, attributed decisions, findings, and handoffs; it does not deliver
live messages or assign work to agents.
