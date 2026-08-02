from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.email.email_service import EmailService
from app.services.audit_trail.logger import log_event

router = APIRouter()


class SendReportRequest(BaseModel):
    invoice_id: str
    email: str


def get_email_service() -> EmailService:
    return EmailService()


@router.post("/email/send-report", summary="Send invoice analysis report by email")
async def send_report(payload: SendReportRequest, email_service: EmailService = Depends(get_email_service)) -> dict:
    try:
        result = await email_service.send_report(str(payload.invoice_id), str(payload.email))
        await log_event(
            event_type="email_report_sent",
            title="Email Report Sent",
            description=f"Report sent to {payload.email} for invoice {payload.invoice_id}.",
            severity="INFO",
            status="SUCCESS",
            module="Email",
            invoice_id=payload.invoice_id,
            metadata={"email": payload.email},
        )
        return result
    except HTTPException:
        raise
    except ValueError as exc:
        await log_event(
            event_type="email_failed",
            title="Email Failed",
            description=f"Failed to send email to {payload.email}: {str(exc)}",
            severity="CRITICAL",
            status="FAILED",
            module="Email",
            invoice_id=payload.invoice_id,
            metadata={"email": payload.email, "error": str(exc)},
        )
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        await log_event(
            event_type="email_failed",
            title="Email Failed",
            description=f"Failed to send email to {payload.email}: {str(exc)}",
            severity="CRITICAL",
            status="FAILED",
            module="Email",
            invoice_id=payload.invoice_id,
            metadata={"email": payload.email, "error": str(exc)},
        )
        raise HTTPException(status_code=500, detail=f"Failed to send report: {exc}") from exc
