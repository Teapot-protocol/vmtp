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

## Usage

This repository contains a simple VMTP client and server for experimentation. To run the demo server:

```bash
python -m vmtp.server
```

The client can send a VMTP message using:

```bash
python -m vmtp.client recipient@example.com "Hello from VMTP"
```

When running against a standard SMTP server, the client will automatically fall back to SMTP.

