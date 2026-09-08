import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'public', 'trainer');
const directories = ['assets', 'content', 'features', 'fonts', 'guided', 'shared'];
const navigationProgressCss = await readFile(
  path.join(root, 'shared', 'navigation-progress.css'),
  'utf8',
);
const navigationProgressJs = await readFile(
  path.join(root, 'shared', 'navigation-progress.js'),
  'utf8',
);
const navigationProgressHead = `<style data-navigation-progress>\n${navigationProgressCss}</style>\n<script data-navigation-progress>\n${navigationProgressJs}</script>`;

if (!target.startsWith(path.join(root, 'public') + path.sep)) {
  throw new Error('Refusing to prepare assets outside public/.');
}

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });

for (const directory of directories) {
  await cp(path.join(root, directory), path.join(target, directory), {
    recursive: true,
  });
}

for (const icon of ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png']) {
  await cp(path.join(root, 'public', icon), path.join(target, icon));
}

const rootEntrypoints = (await readdir(root, { withFileTypes: true }))
  .filter(entry => entry.isFile() && entry.name.endsWith('.html'))
  .map(entry => entry.name);
const htmlEntrypoints = [...rootEntrypoints, path.join('guided', 'player.html')];

for (const entrypoint of htmlEntrypoints) {
  const html = await readFile(path.join(root, entrypoint), 'utf8');
  await writeFile(
    path.join(target, entrypoint),
    html.replace('<head>', `<head>\n${navigationProgressHead}`),
  );
}
