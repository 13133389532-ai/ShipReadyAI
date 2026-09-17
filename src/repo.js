import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const GITHUB_HOSTS = new Set(['github.com', 'www.github.com']);

export function parseGitHubRepoUrl(input) {
  let url;
  try { url = new URL(input); } catch { throw new Error('Enter a valid GitHub repository URL, e.g. https://github.com/owner/repo'); }
  if (url.protocol !== 'https:' || !GITHUB_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error('MVP currently supports public repositories on github.com only.');
  }
  const parts = url.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (parts.length < 2) throw new Error('GitHub URL must look like https://github.com/owner/repo');
  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, '');
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) throw new Error('Unsupported GitHub repository path.');
  return { owner, repo, canonical: `https://github.com/${owner}/${repo}.git` };
}

function dirSize(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += dirSize(full);
    else total += fs.statSync(full).size;
  }
  return total;
}

export function clonePublicRepo(repoUrl, { timeoutMs = 45_000, maxBytes = 100 * 1024 * 1024 } = {}) {
  const parsed = parseGitHubRepoUrl(repoUrl);
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'shipready-'));
  const target = path.join(tempRoot, 'repo');
  const result = spawnSync('git', ['clone', '--depth', '1', '--single-branch', '--no-tags', parsed.canonical, target], {
    encoding: 'utf8',
    timeout: timeoutMs,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_LFS_SKIP_SMUDGE: '1' },
    maxBuffer: 1024 * 1024
  });
  if (result.error?.code === 'ETIMEDOUT') {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    throw new Error('Repository clone timed out. Try a smaller repository.');
  }
  if (result.status !== 0 || !fs.existsSync(target)) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    const detail = String(result.stderr || '').split('\n').find(Boolean) || 'Git clone failed';
    throw new Error(`Unable to clone repository. Make sure it is public and reachable. ${detail}`);
  }
  const bytes = dirSize(target);
  if (bytes > maxBytes) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    throw new Error(`Repository is too large for the MVP scanner (${Math.round(bytes / 1024 / 1024)} MB). Limit is ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  }
  return {
    ...parsed,
    target,
    bytes,
    cleanup: () => fs.rmSync(tempRoot, { recursive: true, force: true })
  };
}
