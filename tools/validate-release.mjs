import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const root = resolve(process.cwd());
const failures = [];
const fail = (message) => failures.push(message);
const exists = async (path) =>
  stat(path).then(
    () => true,
    () => false,
  );
const json = async (path) => {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    fail(`${relative(root, path)}: invalid JSON (${error.message})`);
    return undefined;
  }
};
const files = async (directory) => {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await files(path)));
    else if (entry.isFile()) result.push(path);
  }
  return result;
};
const requirePath = async (base, value, field) => {
  if (typeof value !== 'string' || !value.startsWith('./'))
    return fail(`${field}: expected a relative path`);
  if (!(await exists(resolve(base, value)))) fail(`${field}: missing ${value}`);
};
const forbidden = [
  ['issue number', /#\d{3,}\b/],
  ['session name', /\bW\d+\b/],
  [`work${'tree'} name`, new RegExp(`\\bwork${'tree'}\\s+\\d+\\b`, 'i')],
  ['task or requirement id', /\b(?:T|R)\d+\b|\b(?:FR|SC)-?\d+\b/],
  [`dog${'food'} reference`, new RegExp(`\\bdog${'food'}(?: entry)?\\b`, 'i')],
];

const all = await files(root);
for (const path of all.filter((path) => path.endsWith('.json'))) await json(path);
for (const path of all.filter((path) => {
  const name = relative(root, path).replace(/\\/g, '/');
  return name === 'README.md' || name.startsWith('plugins/');
})) {
  const text = await readFile(path, 'utf8');
  for (const [label, pattern] of forbidden) {
    if (pattern.test(text)) fail(`${relative(root, path)}: contains an internal ${label}`);
  }
}

const openAiMarketplacePath = join(root, '.agents', 'plugins', 'marketplace.json');
const claudeMarketplacePath = join(root, '.claude-plugin', 'marketplace.json');
if (await exists(openAiMarketplacePath)) {
  const marketplace = await json(openAiMarketplacePath);
  const plugins = marketplace?.plugins ?? [];
  if (plugins.map(({ name }) => name).join(',') !== 'retiform-codex-companion') {
    fail('OpenAI marketplace must expose only retiform-codex-companion');
  }
  const versions = new Set();
  for (const name of ['retiform', 'retiform-codex-companion']) {
    const base = join(root, 'plugins', name);
    const manifest = await json(join(base, 'plugin.json'));
    if (manifest?.name !== name) fail(`${name}: manifest name mismatch`);
    versions.add(manifest?.version);
    const listing = manifest?.extensions?.['com.openai']?.interface;
    if (
      !listing ||
      typeof listing.shortDescription !== 'string' ||
      listing.shortDescription.length > 30
    )
      fail(`${name}: invalid shortDescription`);
    for (const field of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) {
      if (!URL.canParse(listing?.[field]) || new URL(listing[field]).protocol !== 'https:') {
        fail(`${name}: ${field} must be an HTTPS URL`);
      }
    }
    await requirePath(
      base,
      manifest?.extensions?.['com.openai']?.onboardingSkill,
      `${name}.onboardingSkill`,
    );
    for (const field of ['composerIcon', 'logo'])
      await requirePath(base, listing?.[field], `${name}.${field}`);
    if (name.endsWith('companion')) {
      await requirePath(base, manifest?.extensions?.['com.openai']?.hooks, `${name}.hooks`);
    } else if (manifest?.extensions?.['com.openai']?.hooks !== undefined) {
      fail(`${name}: portable plugin must not declare hooks`);
    }
    for (const skill of [
      'decisions',
      'findings',
      'handoff',
      'import',
      'setup',
      'shared-decisions',
    ]) {
      for (const path of [`skills/${skill}/SKILL.md`, `skills/${skill}/agents/openai.yaml`]) {
        if (!(await exists(join(base, path)))) fail(`${name}: missing ${path}`);
      }
    }
  }
  if (versions.size !== 1 || versions.has(undefined)) fail('OpenAI plugin versions must match');
} else if (await exists(claudeMarketplacePath)) {
  const marketplace = await json(claudeMarketplacePath);
  const plugins = marketplace?.plugins ?? [];
  if (plugins.length !== 1 || plugins[0]?.name !== 'retiform')
    fail('Claude marketplace must expose retiform once');
  const base = join(root, 'plugins', 'retiform');
  const manifest = await json(join(base, '.claude-plugin', 'plugin.json'));
  if (plugins[0]?.version !== manifest?.version)
    fail('Claude marketplace and plugin versions must match');
  if (plugins[0]?.source !== './plugins/retiform') fail('Claude marketplace source is invalid');
  for (const path of ['.mcp.json', 'hooks/hooks.json']) {
    if (!(await exists(join(base, path)))) fail(`retiform: missing ${path}`);
  }
  for (const skill of ['decisions', 'findings', 'handoff', 'import', 'link', 'shared-decisions']) {
    if (!(await exists(join(base, 'skills', skill, 'SKILL.md'))))
      fail(`retiform: missing skill ${skill}`);
  }
} else {
  fail('no supported marketplace manifest found');
}

if (failures.length) {
  for (const failure of failures) process.stderr.write(`release validation: ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('release validation: passed\n');
}
