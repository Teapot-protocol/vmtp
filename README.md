# VMTP

Vector Mail Transfer Protocol (VMTP) is a fictional extension to the standard SMTP protocol. It introduces modern features while maintaining full backward compatibility with existing SMTP servers and clients.

## Goals

* Provide an example of how a mail protocol could evolve while staying interoperable with SMTP.
* Demonstrate a reference implementation in Python using standard libraries.
* Act as a playground for experimenting with mail delivery concepts.

## Compatibility

VMTP operates on top of SMTP. Every VMTP client can communicate with a standard SMTP server. When both the client and server support VMTP, additional commands are available that enable advanced features. When these commands are absent, communication falls back to plain SMTP.

## Repository Layout

* `SPEC.md` – Detailed description of the VMTP commands and behavior.
* `vmtp/` – Reference Python implementation.
* `worker/` – Cloudflare Worker implementation of a minimal VMTP gateway.
* `client/` – JavaScript client library for interacting with the worker.
* `cli/` – Command line utility built on top of the client library.

## Usage

This repository contains a simple VMTP client and server for experimentation. To run the demo server:

```bash
python -m vmtp.server
```

The client can send a VMTP message using:

```bash
python -m vmtp.client recipient@example.com "Hello from VMTP"
```

Attachments and metadata can be included using the CLI options:

```bash
python -m vmtp.client --attach example.txt --metadata key=value \
    recipient@example.com "With extras"
```

When running against a standard SMTP server, the client will automatically fall back to SMTP.

## Cloudflare Worker

The repository also includes a Cloudflare Worker that exposes a minimal HTTP API for sending VMTP messages. Deploy the worker with the Wrangler CLI:

```bash
wrangler publish
```

Install the JavaScript dependencies for the CLI:

```bash
npm install
```

Once deployed, you can send a message using the provided CLI:

```bash
node cli/index.js --worker https://your-worker.example.workers.dev \
    recipient@example.com "Hello from VMTP via Worker"
# send with an attachment
node cli/index.js --worker https://your-worker.example.workers.dev \
    --attach ./file.txt recipient@example.com "With attachment"
```

The worker also exposes a `/batch` endpoint that accepts an array of messages:

```bash
curl -X POST https://your-worker.example.workers.dev/batch \
     -H 'Content-Type: application/json' \
     -d '{"messages":[{"sender":"a@example.com","recipients":["b@example.com"],"subject":"test","body":"hi"}]}'
```


## License

This project is licensed under the terms of the MIT License. See [LICENSE](LICENSE) for details.
