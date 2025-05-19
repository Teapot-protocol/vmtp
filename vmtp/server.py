"""Minimal VMTP server implementation."""

import asyncore
import smtpd
from email import message_from_bytes


class VMTPServer(smtpd.SMTPServer):
    """SMTP server that advertises VMTP support."""

    def __init__(self, localaddr, remoteaddr):
        super().__init__(localaddr, remoteaddr)
        self.enable_VMTP = True

    def process_message(self, peer, mailfrom, rcpttos, data, **kwargs):
        print(f"Received message from {mailfrom} to {rcpttos}")
        msg = message_from_bytes(data)
        if msg.is_multipart():
            for part in msg.iter_attachments():
                print(
                    f"Attachment: {part.get_filename()} ({part.get_content_type()})"
                )
        else:
            print(msg.get_payload())
        return None  # accept the message

    # Advertise VMTP during EHLO
    def smtp_EHLO(self, arg):
        resp = super().smtp_EHLO(arg)
        if self.enable_VMTP:
            self.push("250-VMTP")
        return resp

    # Handle VECMAIL command (simplified)
    def smtp_VECMAIL(self, arg):
        print(f"VECMAIL: {arg}")
        self.push("250 OK")

    # Handle METADATA command (simplified)
    def smtp_METADATA(self, arg):
        print(f"METADATA: {arg}")
        self.push("250 OK")


def run(host="localhost", port=8025):
    server = VMTPServer((host, port), None)
    print(f"VMTP server running on {host}:{port}")
    try:
        asyncore.loop()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    run()
