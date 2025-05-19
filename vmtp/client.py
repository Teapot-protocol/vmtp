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
    ) -> None:
        """Send a message using VMTP if supported."""

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

        self.smtp.data(msg.as_string())


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Send a VMTP message")
    parser.add_argument("recipient", nargs="+", help="recipient address")
    parser.add_argument("body", help="message body")
    parser.add_argument("--server", default="localhost", help="SMTP server host")
    parser.add_argument("--subject", default="VMTP Test", help="message subject")
    args = parser.parse_args()

    client = VMTPClient(args.server)
    client.send_message("noreply@example.com", args.recipient, args.subject, args.body)
    client.close()


if __name__ == "__main__":
    main()
