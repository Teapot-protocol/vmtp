# VMTP CLI

This directory contains a small command line utility for sending VMTP messages
to the example Cloudflare Worker included in this repository.

## Usage

```bash
node index.js [options] <recipient...> <body>
```

### Options

- `--worker <url>`: URL of the worker endpoint. Defaults to `http://localhost:8787`.
- `--subject <subject>`: Subject line of the message. Defaults to `VMTP Test`.
- `--sender <address>`: Sender address. Defaults to `noreply@example.com`.
- `--metadata <key=value>`: Metadata pairs to attach to the message. May be
  specified multiple times.
- `--metadata-file <path>`: Path to a JSON file whose key/value pairs will be
  merged into the metadata object.
```
