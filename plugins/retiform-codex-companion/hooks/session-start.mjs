import { output, respond } from './session-start-core.mjs';
import { isEntry } from './link.mjs';
import { dataDirectory, readTrackedHandoff } from './track-handoff.mjs';

export { dataDirectory };

export function compactedInstruction(since, entryId) {
  const handoff = entryId === undefined
    ? ('call recall_memory with `labels: ["handoff"]`, `about` holding the Project identifier above and a topic for ' +
       'the current work. If the newest relevant handoff clearly belongs to this session, supersede it with the work ' +
       'done and left; otherwise record a new handoff')
    : (`call supersede_memory with \`entryId: "${entryId}"\`, the work done and left, label \`handoff\`, and ` +
       '`about` holding the Project identifier above');
  return 'This session was just compacted. Before continuing, ' + handoff + '. Then call recall_memory with the same ' +
    `\`about\`, \`includeTenantWide: true\` and \`since: "${since}"\` for decisions other sessions recorded since ` +
    'the day before compaction.';
}

export const CODEX = {
  version: 4,
  details:
    'Use the Retiform shared-decisions skill for the statement form, related recall, and conflict handling.',
  suggestLink:
    'Suggest the Retiform setup skill once so the developer can choose Project scope for this session',
  unlinkedAdvice:
    'If Project scope is needed, suggest the Retiform setup skill once. It can list Projects and verify an existing ' +
    'repository link, but it does not create one.',
  runLink:
    'Use the Retiform setup skill to choose Project scope for this session; it does not create a repository link.',
  correctOrLink:
    'Correct the link file, or use the Retiform setup skill to choose Project scope for this session; setup does not ' +
    'create the link.',
  compacted: (since) => compactedInstruction(since),
};

async function readAll(stream) {
  let text = '';
  for await (const chunk of stream) text += chunk;
  return text;
}

export async function main({ stdin, stdout, cwd, env }) {
  try {
    stdin.setEncoding?.('utf8');
    const text = await readAll(stdin);
    const directory = dataDirectory(env);
    let sessionId;
    try {
      const input = JSON.parse(text);
      sessionId = typeof input.session_id === 'string' ? input.session_id : undefined;
    } catch {
      sessionId = undefined;
    }
    const entryId = readTrackedHandoff(directory, sessionId);
    const wording = { ...CODEX, compacted: (since) => compactedInstruction(since, entryId) };
    stdout.write(output(respond(text, { cwd, dataDirectory: directory, wording })));
  } catch {
    // Never prevent the session from starting.
  }
}

if (isEntry(import.meta.url, process.argv[1])) {
  await main({ stdin: process.stdin, stdout: process.stdout, cwd: process.cwd(), env: process.env });
}
