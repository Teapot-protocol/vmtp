#!/usr/bin/env node
import { program } from 'commander';
import { sendMessage } from '../client/index.js';

program
  .argument('<recipient...>', 'recipient addresses')
  .argument('<body>', 'message body')
  .option('--worker <url>', 'worker URL', 'http://localhost:8787')
  .option('--subject <subject>', 'message subject', 'VMTP Test')
  .option('--sender <address>', 'sender address', 'noreply@example.com');

program.parse();
const opts = program.opts();
const args = program.args;
const recipients = args.slice(0, args.length - 1);
const body = args[args.length - 1];

sendMessage(opts.worker, opts.sender, recipients, opts.subject, body)
  .then((r) => {
    console.log(r);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
