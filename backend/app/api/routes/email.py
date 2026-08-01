from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.email.email_service import EmailService

router = APIRouter()


class SendReportRequest(BaseModel):
    invoice_id: str
    email: str


def get_email_service() -> EmailService:
    return EmailService()


@router.post("/email/send-report", summary="Send invoice analysis report by email")
async def send_report(payload: SendReportRequest, email_service: EmailService = Depends(get_email_service)) -> dict:
    try:
        return await email_service.send_report(str(payload.invoice_id), str(payload.email))
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to send report: {exc}") from exc
