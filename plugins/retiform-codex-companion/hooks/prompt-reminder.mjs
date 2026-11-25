// The prompt reminder hook (#1131, contracts/plugin-surface.md *Before each prompt*).
//
// Of the four moments, asking for context before acting is the one sessions miss: assemble_context fell to 3 calls a
// day, then none, across nine sessions (#1131, 2026-11-23). The session-start instruction names it, but is read hours
// before the moment comes. Claude Code runs a UserPromptSubmit hook on each prompt, including a message from another
// session and a scheduled turn, and adds its stdout to the model's context beside the prompt. This hook adds one
// sentence there, linked repository or not: assemble_context needs no Project.
//
// A background task's notification is not a request, so it gets nothing. Claude Code gives no field for a prompt's
// origin, so a notification is recognised by its markers in the prompt's first 500 characters, where a wrapper such
// as <system-reminder> may come first (W1's review of #1593). A message from another session gets the reminder even
// when it quotes a notification.
// Like the other hooks, it makes no network call, reads only its input, and never throws.
import { isEntry } from './link.mjs';

/** The reminder's own version, raised whenever its text changes. */
export const REMINDER_VERSION = 1;

/** The fixed sentence added beside each prompt. */
export function reminder() {
  return `Retiform (prompt reminder version ${REMINDER_VERSION}): if this asks about something the team may ` +
    'already have settled (steps for others to follow, a value from a contract or specification, the reason for a ' +
    'past decision), call assemble_context with the question first and cite what it returns.';
}

const NOTIFICATION = /<task-notification>|\[SYSTEM NOTIFICATION/;
const PEER_MESSAGE = /^\s*<cross-session-message[\s>]/;
const HEAD = 500;

function parse(text) {
  try {
    const value = JSON.parse(text);
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

/** The hook's stdout for its stdin text: the reminder, except beside a task notification or an empty prompt. */
export function respond(stdinText) {
  const { prompt } = parse(stdinText);
  if (typeof prompt !== 'string') return reminder();
  if (prompt.trim() === '') return '';
  if (!PEER_MESSAGE.test(prompt) && NOTIFICATION.test(prompt.slice(0, HEAD))) return '';
  return reminder();
}

async function readAll(stream) {
  let text = '';
  for await (const chunk of stream) text += chunk;
  return text;
}

/** Runs the hook: reads stdin, writes its output. Never throws, so the prompt always goes ahead. */
export async function main({ stdin, stdout }) {
  try {
    stdin.setEncoding?.('utf8');
    stdout.write(respond(await readAll(stdin)));
  } catch {
    // The prompt goes ahead without the reminder.
  }
}

if (isEntry(import.meta.url, process.argv[1])) {
  await main({ stdin: process.stdin, stdout: process.stdout });
}
