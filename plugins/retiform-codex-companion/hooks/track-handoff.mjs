import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isEntry } from './link.mjs';

export const HANDOFFS = 'latest-handoffs';
const ENTRY_ID = /^[A-Za-z0-9_-]{1,128}$/;

function parse(text) {
  try {
    const value = JSON.parse(text);
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function dataDirectory(env) {
  return typeof env.PLUGIN_DATA === 'string' && env.PLUGIN_DATA !== ''
    ? env.PLUGIN_DATA
    : typeof env.CLAUDE_PLUGIN_DATA === 'string' && env.CLAUDE_PLUGIN_DATA !== ''
      ? env.CLAUDE_PLUGIN_DATA
      : undefined;
}

function recordName(sessionId) {
  return createHash('sha256').update(sessionId, 'utf8').digest('hex');
}

function recordPath(directory, sessionId) {
  return join(directory, HANDOFFS, recordName(sessionId));
}

function validEntryId(value) {
  return typeof value === 'string' && ENTRY_ID.test(value) ? value : undefined;
}

function responseEntryId(value, depth = 0) {
  if (depth > 8 || value === null || value === undefined) return undefined;
  if (typeof value === 'string') {
    if (!value.trimStart().startsWith('{') && !value.trimStart().startsWith('[')) return undefined;
    try {
      return responseEntryId(JSON.parse(value), depth + 1);
    } catch {
      return undefined;
    }
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = responseEntryId(item, depth + 1);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (typeof value !== 'object') return undefined;
  const direct = validEntryId(value.entryId);
  if (direct !== undefined) return direct;
  for (const child of Object.values(value)) {
    const found = responseEntryId(child, depth + 1);
    if (found !== undefined) return found;
  }
  return undefined;
}

export function readTrackedHandoff(directory, sessionId) {
  if (typeof directory !== 'string' || directory === '' || typeof sessionId !== 'string' || sessionId === '') {
    return undefined;
  }
  try {
    return validEntryId(readFileSync(recordPath(directory, sessionId), 'utf8').trim());
  } catch {
    return undefined;
  }
}

export function removeTrackedHandoff(directory, sessionId) {
  try {
    unlinkSync(recordPath(directory, sessionId));
    return true;
  } catch {
    return false;
  }
}

function hasHandoffLabel(input) {
  return input.label === 'handoff' ||
    (Array.isArray(input.labels) && input.labels.includes('handoff'));
}

export function trackHandoff(text, env) {
  const event = parse(text);
  const directory = dataDirectory(env);
  const sessionId = event.session_id;
  const input = event.tool_input;
  if (directory === undefined || typeof sessionId !== 'string' || sessionId === '' ||
      input === null || typeof input !== 'object' || Array.isArray(input)) return false;
  const current = readTrackedHandoff(directory, sessionId);
  const recordsHandoff = event.tool_name === 'mcp__retiform__record_memory' && hasHandoffLabel(input);
  const supersedesHandoff = event.tool_name === 'mcp__retiform__supersede_memory' &&
    (hasHandoffLabel(input) || (current !== undefined && input.entryId === current));
  if (!recordsHandoff && !supersedesHandoff) return false;
  const entryId = responseEntryId(event.tool_response);
  if (entryId === undefined) return false;
  try {
    const parent = join(directory, HANDOFFS);
    mkdirSync(parent, { recursive: true });
    const path = recordPath(directory, sessionId);
    const temporary = `${path}.${process.pid}.tmp`;
    writeFileSync(temporary, `${entryId}\n`, { mode: 0o600 });
    renameSync(temporary, path);
    return true;
  } catch {
    return false;
  }
}

async function readAll(stream) {
  let text = '';
  for await (const chunk of stream) text += chunk;
  return text;
}

export async function main({ stdin, env }) {
  try {
    stdin.setEncoding?.('utf8');
    trackHandoff(await readAll(stdin), env);
  } catch {
    // Tracking is advisory and must never block the completed tool call.
  }
}

if (isEntry(import.meta.url, process.argv[1])) await main({ stdin: process.stdin, env: process.env });
