"""Simple VMTP client implementation."""

import smtplib
from email.message import EmailMessage
from typing import Iterable


class VMTPClient:
    """Client that speaks VMTP with SMTP fallback."""

    def __init__(self, host: str, port: int = 25):
        self.host = host
        self.port = port
        self.smtp = smtplib.SMTP(host, port)
        self._supports_vmtp = False
        self._check_server_capabilities()

    def _check_server_capabilities(self) -> None:
        code, capabilities = self.smtp.ehlo()
        if code == 250 and b"VMTP" in capabilities:
            self._supports_vmtp = True

    def close(self) -> None:
        self.smtp.quit()

    def send_message(
        self,
        sender: str,
        recipients: Iterable[str],
        subject: str,
        body: str,
        metadata: dict | None = None,
        attachments: Iterable[tuple[str, bytes]] | None = None,
    ) -> None:
        """Send a message using VMTP if supported.

        Parameters
        ----------
        sender : str
            The address of the sender.
        recipients : Iterable[str]
            Recipient addresses.
        subject : str
            Message subject line.
        body : str
            Message body text.
        metadata : dict | None
            Optional key/value metadata pairs.
        attachments : Iterable[tuple[str, bytes]] | None
            Optional sequence of ``(filename, content)`` attachments.
        """

        if self._supports_vmtp and metadata:
            for key, value in metadata.items():
                try:
                    self.smtp.docmd("METADATA", f"{key} {value}")
                except smtplib.SMTPResponseException:
                    # Server rejected METADATA; fall back to SMTP
                    break

        if self._supports_vmtp and len(recipients) > 1:
            to_list = ",".join(recipients)
            try:
                self.smtp.docmd(
                    "VECMAIL",
                    f"FROM:<{sender}> TO:<{to_list}> SIZE={len(body)}",
                )
            except smtplib.SMTPResponseException:
                # Server rejected VECMAIL; fall back to SMTP
                self.smtp.mail(sender)
                for r in recipients:
                    self.smtp.rcpt(r)
        else:
            self.smtp.mail(sender)
            for r in recipients:
                self.smtp.rcpt(r)

        msg = EmailMessage()
        msg["From"] = sender
        msg["To"] = ", ".join(recipients)
        msg["Subject"] = subject
        msg.set_content(body)

        if attachments:
            for filename, content in attachments:
                maintype = "application"
                subtype = "octet-stream"
                msg.add_attachment(
                    content, maintype=maintype, subtype=subtype, filename=filename
                )

        self.smtp.data(msg.as_string())


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Send a VMTP message")
    parser.add_argument("recipient", nargs="+", help="recipient address")
    parser.add_argument("body", help="message body")
    parser.add_argument("--server", default="localhost", help="SMTP server host")
    parser.add_argument("--subject", default="VMTP Test", help="message subject")
    parser.add_argument(
        "--metadata",
        action="append",
        help="metadata key=value pairs (can be repeated)",
    )
    parser.add_argument("--metadata-file", help="JSON file with metadata")
    parser.add_argument(
        "--attach",
        action="append",
        help="file attachment (can be repeated)",
    )
    args = parser.parse_args()

    client = VMTPClient(args.server)
    metadata = {}
    if args.metadata:
        for pair in args.metadata:
            if "=" in pair:
                k, v = pair.split("=", 1)
                metadata[k] = v
    if args.metadata_file:
        import json

        with open(args.metadata_file, "r", encoding="utf8") as f:
            metadata.update(json.load(f))

    attachments = []
    if args.attach:
        for path in args.attach:
            with open(path, "rb") as f:
                attachments.append((path.split("/")[-1], f.read()))

    client.send_message(
        "noreply@example.com",
        args.recipient,
        args.subject,
        args.body,
        metadata,
        attachments,
    )
    client.close()


if __name__ == "__main__":
    main()
