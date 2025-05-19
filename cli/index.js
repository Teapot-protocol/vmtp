#!/usr/bin/env node
import { program } from 'commander';
import { readFileSync } from 'fs';
import { sendMessage } from '../client/index.js';

program
  .argument('<recipient...>', 'recipient addresses')
  .argument('<body>', 'message body')
  .option('--worker <url>', 'worker URL', 'http://localhost:8787')
  .option('--subject <subject>', 'message subject', 'VMTP Test')
  .option('--sender <address>', 'sender address', 'noreply@example.com')
  .option('--metadata <pair...>', 'metadata key=value pairs')
  .option('--metadata-file <path>', 'JSON file containing metadata');

program.parse();
const opts = program.opts();
const args = program.args;
const recipients = args.slice(0, args.length - 1);
const body = args[args.length - 1];
const metadata = {};
if (opts.metadata) {
  const pairs = Array.isArray(opts.metadata) ? opts.metadata : [opts.metadata];
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value !== undefined) {
      metadata[key] = value;
    }
  }
}

if (opts.metadataFile) {
  try {
    const contents = readFileSync(opts.metadataFile, 'utf8');
    Object.assign(metadata, JSON.parse(contents));
  } catch (err) {
    console.error(`Failed to read metadata file: ${err.message}`);
    process.exit(1);
  }
}

sendMessage(opts.worker, opts.sender, recipients, opts.subject, body, metadata)
  .then((r) => {
    console.log(r);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
