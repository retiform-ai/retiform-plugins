// The repository link: `.retiform/project.json` at the repository root, holding the repository's Project entity
// identifier and the file format's version.
//
// Anyone who can open a pull request can change this file, and the identifier reaches text the agent reads. The
// file is therefore accepted only when it is a JSON object with exactly the members `project` and `version`,
// `project` is a lowercase canonical UUID and `version` is 1. A rejected file yields a fixed reason and never any
// of its content.
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LINK_DIRECTORY = '.retiform';
export const LINK_FILE = 'project.json';
export const LINK_VERSION = 1;
// JavaScript's `$` without the m flag matches only at the end of the input, so a trailing newline is rejected.
export const PROJECT_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// A valid file is under 100 bytes; anything far larger is not read.
export const MAX_LINK_BYTES = 4096;
const MEMBERS = ['project', 'version'];

/** Validates the file's text: `{ ok: true, project }` or `{ ok: false, reason }` with a fixed reason. */
export function validateLink(text) {
  let document;
  try {
    document = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'not-json' };
  }
  if (document === null || typeof document !== 'object' || Array.isArray(document)) {
    return { ok: false, reason: 'not-an-object' };
  }
  const members = Object.keys(document);
  if (members.length !== MEMBERS.length || !MEMBERS.every((member) => members.includes(member))) {
    return { ok: false, reason: 'wrong-members' };
  }
  if (document.version !== LINK_VERSION) {
    return { ok: false, reason: 'unsupported-version' };
  }
  if (typeof document.project !== 'string' || !PROJECT_PATTERN.test(document.project)) {
    return { ok: false, reason: 'invalid-project' };
  }
  return { ok: true, project: document.project };
}

/**
 * Finds the link file from a working directory: the nearest `.retiform/project.json` in it or an ancestor, up to
 * and including the repository root (the first directory holding `.git`). Returns the path, or null.
 */
export function findLink(start) {
  let directory = resolve(start);
  for (;;) {
    const candidate = join(directory, LINK_DIRECTORY, LINK_FILE);
    if (existsSync(candidate)) return candidate;
    if (existsSync(join(directory, '.git'))) return null;
    const parent = dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}

/** `{ status: 'linked', project }`, `{ status: 'missing' }` or `{ status: 'invalid', reason }`. */
export function readLink(start) {
  const path = findLink(start);
  if (path === null) return { status: 'missing' };
  let text;
  try {
    const stats = statSync(path);
    if (!stats.isFile()) return { status: 'invalid', reason: 'not-a-file' };
    if (stats.size > MAX_LINK_BYTES) return { status: 'invalid', reason: 'too-large' };
    text = readFileSync(path, 'utf8');
  } catch {
    return { status: 'invalid', reason: 'unreadable' };
  }
  const result = validateLink(text);
  return result.ok ? { status: 'linked', project: result.project } : { status: 'invalid', reason: result.reason };
}

/**
 * `node link.mjs --check`: the link skill's check of the written file, from a working directory.
 * Returns the exit status and the one line to print; the line names the Project or a fixed reason, never other
 * content of the file.
 */
export function check(argv, start) {
  if (argv.length !== 1 || argv[0] !== '--check') return { status: 2, line: 'Usage: node link.mjs --check' };
  const link = readLink(start);
  if (link.status === 'linked') return { status: 0, line: `Linked to Project ${link.project}.` };
  if (link.status === 'missing') return { status: 1, line: `No ${LINK_DIRECTORY}/${LINK_FILE} in this repository.` };
  return { status: 1, line: `${LINK_DIRECTORY}/${LINK_FILE} is not a valid link (${link.reason}).` };
}

/** Whether this module is the process's entry point (Windows paths compare case-insensitively). */
export function isEntry(moduleUrl, argument) {
  if (typeof argument !== 'string') return false;
  try {
    const fold = (path) => (process.platform === 'win32' ? path.toLowerCase() : path);
    return fold(realpathSync(argument)) === fold(realpathSync(fileURLToPath(moduleUrl)));
  } catch {
    return false;
  }
}

if (isEntry(import.meta.url, process.argv[1])) {
  const { status, line } = check(process.argv.slice(2), process.cwd());
  (status === 0 ? process.stdout : process.stderr).write(`${line}\n`);
  process.exitCode = status;
}
