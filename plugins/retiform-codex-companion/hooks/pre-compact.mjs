import { isEntry } from './link.mjs';

export function respond() {
  return JSON.stringify({
    systemMessage:
      'Retiform: after compaction, Codex will restore the Project recall and durable handoff instruction.'
  });
}

export function main({ stdout }) {
  try {
    stdout.write(respond());
  } catch {
    // Never prevent compaction.
  }
}

if (isEntry(import.meta.url, process.argv[1])) main({ stdout: process.stdout });
