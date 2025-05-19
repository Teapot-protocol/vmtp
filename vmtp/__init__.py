"""Reference implementation of the VMTP protocol.

This package provides a minimal client and server built on top of Python's
`smtplib` and `smtpd` modules. The implementation is intentionally simple and
serves only as an example of how VMTP could be layered over SMTP.
"""

__all__ = ["client", "server"]
