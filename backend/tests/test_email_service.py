import pytest

from app.services.email.email_service import EmailService


def test_validate_recipient_email_rejects_invalid_address():
    service = EmailService()

    with pytest.raises(ValueError, match="Invalid email"):
        service.validate_recipient_email("not-an-email")
