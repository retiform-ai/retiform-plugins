import { isEntry } from './link.mjs';

export function respond() {
  return JSON.stringify({
    systemMessage:
      'Retiform: the latest handoff identifier is tracked locally. After compaction, Codex will use it to update the ' +
      'same handoff instead of recording a duplicate.'
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
