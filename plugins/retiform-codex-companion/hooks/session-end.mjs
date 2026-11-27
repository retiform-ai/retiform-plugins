import { createHash } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { isEntry } from './link.mjs';
import { dataDirectory, removeTrackedHandoff } from './track-handoff.mjs';

function parse(text) {
  try {
    const value = JSON.parse(text);
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function removeSessionRecord(text, env) {
  const input = parse(text);
  const data = dataDirectory(env);
  if (typeof data !== 'string' || data === '' || typeof input.session_id !== 'string' || input.session_id === '') {
    return false;
  }
  const name = createHash('sha256').update(input.session_id, 'utf8').digest('hex');
  let removed = removeTrackedHandoff(data, input.session_id);
  try {
    unlinkSync(join(data, 'instructed-sessions', name));
    removed = true;
  } catch {
    // Either record may already be absent.
  }
  return removed;
}

async function readAll(stream) {
  let text = '';
  for await (const chunk of stream) text += chunk;
  return text;
}

export async function main({ stdin, env }) {
  try {
    stdin.setEncoding?.('utf8');
    removeSessionRecord(await readAll(stdin), env);
  } catch {
    // Session end is advisory and must stay silent.
  }
}

if (isEntry(import.meta.url, process.argv[1])) await main({ stdin: process.stdin, env: process.env });
