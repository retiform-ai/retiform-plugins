import { output, respond } from './session-start-core.mjs';
import { isEntry } from './link.mjs';

export const CODEX = {
  details:
    'Use the Retiform shared-decisions skill for the statement form, related recall, and conflict handling.',
  suggestLink:
    'Suggest the Retiform setup skill once so the developer can verify this repository Project',
  runLink: 'Use the Retiform setup skill to verify this repository Project.',
  correctOrLink: 'Correct it, or use the Retiform setup skill.',
};

export function dataDirectory(env) {
  return typeof env.PLUGIN_DATA === 'string' && env.PLUGIN_DATA !== ''
    ? env.PLUGIN_DATA
    : typeof env.CLAUDE_PLUGIN_DATA === 'string' && env.CLAUDE_PLUGIN_DATA !== ''
      ? env.CLAUDE_PLUGIN_DATA
      : undefined;
}

async function readAll(stream) {
  let text = '';
  for await (const chunk of stream) text += chunk;
  return text;
}

export async function main({ stdin, stdout, cwd, env }) {
  try {
    stdin.setEncoding?.('utf8');
    const text = await readAll(stdin);
    stdout.write(output(respond(text, { cwd, dataDirectory: dataDirectory(env), wording: CODEX })));
  } catch {
    // Never prevent the session from starting.
  }
}

if (isEntry(import.meta.url, process.argv[1])) {
  await main({ stdin: process.stdin, stdout: process.stdout, cwd: process.cwd(), env: process.env });
}
