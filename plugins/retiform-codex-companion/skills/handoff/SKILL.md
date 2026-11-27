---
name: handoff
description: Read or leave a durable handoff for the next agent or session. Use when work is being transferred, a session is ending, or compacted context must be recoverable.
---

# Hand off work

A Retiform handoff is durable shared memory, not a live message or delivery guarantee. It lets a later agent discover
the current state even when the two agents run on different platforms.

At the start of transferred work, call `recall_memory` with the label `handoff`, the Project in `about` when known,
and a topic matching the task. Summarize the newest relevant handoff with its writer and date, then verify claims
against the repository or cited passages before acting.

When leaving a handoff, record only what a successor needs: objective, completed work, current state, important
evidence or identifiers, remaining work, and blockers. Call `record_memory` with label `handoff`, Project and subjects
in `about`, and source passages where appropriate. Supersede this session's earlier handoff when updating it. Do not
supersede another agent's handoff merely because you continued the work; record a new one that names what changed.

Do not claim that a recipient was notified, is online, accepted the work, or will act. Retiform does not provide live
presence, task assignment, scheduling, or agent-to-agent delivery.
