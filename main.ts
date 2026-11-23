// gta6-meme-x-01 entry program (Node 22, standard library only).
//
// What the entry is: a GTA 6 meme posted on X from a public account. The post
// carries the make.fun play code and the @makefunai tag in its text, and this
// repository's POST.json names that post's address. The house reads the post
// itself from X; this program's only job is to hand POST.json to the gate.
//
// What it does, in order:
//   1. Reads POST.json from the bot directory (MAKEFUN_BOT_DIR, default /bot).
//   2. Parses it and refuses to pass on a placeholder or a malformed address:
//      the url must be a real x.com status address, https://x.com/<name>/status/<id>.
//   3. Writes the file, unchanged, to POST.json in the output directory
//      (MAKEFUN_OUTPUT_DIR, default /output), creating that directory first.
//   4. Reads the written file back and compares it byte for byte with the
//      source, so a truncated or altered copy fails loudly instead of
//      reaching the gate.
//
// Local run: mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const botDir = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const sourcePath = join(botDir, 'POST.json');
const targetPath = join(outputDir, 'POST.json');

// An X status address: a screen name of letters, digits or underscores, then
// a numeric status id. Anything else (the starter's <handle>/<id> placeholder
// included) is not a post the house can read.
const statusAddress = /^https:\/\/x\.com\/[A-Za-z0-9_]+\/status\/[0-9]+$/;

function fail(message: string): never {
  console.error(`gta6-meme-x-01: ${message}`);
  process.exit(1);
}

let raw: string;
try {
  raw = readFileSync(sourcePath, 'utf8');
} catch (err) {
  fail(`cannot read ${sourcePath}: ${(err as Error).message}`);
}

// A UTF-8 byte order mark at the head of the file makes JSON.parse throw,
// although the document after it is fine; drop the mark before parsing. The
// bytes written onward are the file as read, mark included, so the copy the
// gate receives still matches the source exactly.
const parseable = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;

let post: { url?: unknown };
try {
  post = JSON.parse(parseable) as { url?: unknown };
} catch (err) {
  fail(`POST.json is not valid JSON: ${(err as Error).message}`);
}

if (typeof post.url !== 'string' || !statusAddress.test(post.url)) {
  fail(`POST.json url is not an X status address: ${JSON.stringify(post.url)}`);
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(targetPath, raw);

const written = readFileSync(targetPath, 'utf8');
if (written !== raw) {
  fail(`the copy at ${targetPath} differs from ${sourcePath}; refusing to pass it on`);
}

console.log(
  `gta6-meme-x-01: POST.json for ${post.url} delivered to ${targetPath} (${Buffer.byteLength(raw)} bytes, verified)`,
);
