# VMTP Specification

VMTP (Vector Mail Transfer Protocol) extends SMTP by adding optional commands for batch and metadata operations. Standard SMTP commands remain fully supported.

## Connection

VMTP clients connect using the same TCP ports as SMTP (25, 465 for SMTPS, or 587 for submission). Upon connection, the server advertises `VMTP` in the `EHLO` response if it supports the protocol.

## Commands

The following commands are added on top of SMTP:

### VECMAIL

```
VECMAIL FROM:<address> TO:<addr1,addr2,...> SIZE=<bytes>
```

Sends a single message to multiple recipients in one transaction. This command is ignored by servers that do not recognize it, in which case the client falls back to standard `MAIL FROM` and repeated `RCPT TO` commands.

### METADATA

```
METADATA key value
```

Allows the client to attach arbitrary key/value metadata to the next message. Metadata lines are sent before the `DATA` command. Servers that do not understand this command simply respond with `502 Command not implemented` and the client omits metadata.

## Fallback Behavior

When a command is rejected with a `5xx` or `502` response, the client must revert to plain SMTP. All VMTP features are optional and designed so that a pure SMTP server will still deliver mail correctly.

## Example Session

```
S: 220 vmtp.example.com ESMTP VMTP ready
C: EHLO client.example.com
S: 250-vmtp.example.com VMTP
S: 250-SIZE 10485760
S: 250 HELP
C: VECMAIL FROM:<alice@example.com> TO:<bob@example.com,charlie@example.com> SIZE=1024
S: 250 OK
C: METADATA client-id 12345
S: DATA
S: 354 End data with <CR><LF>.<CR><LF>
C: ... message body ...
C: .
S: 250 Message accepted
```

If the server had not advertised `VMTP`, the client would instead send standard SMTP commands and still complete the delivery.

