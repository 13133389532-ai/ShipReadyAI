import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGitHubRepoUrl } from '../src/repo.js';

test('parses a normal github repository URL', () => {
  const out = parseGitHubRepoUrl('https://github.com/acme/demo');
  assert.equal(out.owner, 'acme');
  assert.equal(out.repo, 'demo');
  assert.equal(out.canonical, 'https://github.com/acme/demo.git');
});

test('normalizes .git suffix', () => {
  assert.equal(parseGitHubRepoUrl('https://github.com/acme/demo.git').repo, 'demo');
});

test('rejects non-github hosts', () => {
  assert.throws(() => parseGitHubRepoUrl('https://evil.example/acme/demo'), /github.com only/);
});
