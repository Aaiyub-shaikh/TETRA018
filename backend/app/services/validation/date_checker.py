from datetime import datetime, date

SUPPORTED_FORMATS = [
    "%d-%b-%Y", "%d-%B-%Y", "%d %b %Y", "%d %B %Y",
    "%b %d, %Y", "%b %d %Y", "%B %d, %Y", "%B %d %Y",
    "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d",
    "%d/%m/%y", "%d-%m-%y", "%d-%b-%y", "%d-%B-%y"
]


def parse_date_str(date_str: str):
    if not date_str:
        return None
    date_str = date_str.strip()
    for fmt in SUPPORTED_FORMATS:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return None

def check_date(invoice_date_str: str, due_date_str: str = None) -> dict:
    """
    Validates:
    - Invoice date is not in the future
    - Invoice date is not older than 2 years (stale invoice fraud signal)
    - Due date is after invoice date (if both present)
    """
    invoice_date = parse_date_str(invoice_date_str)
    today = date.today()

    if not invoice_date:
        return {"valid": False, "reason": f"Could not parse invoice date: '{invoice_date_str}'"}

    # Future date check
    if invoice_date > today:
        return {
            "valid": False,
            "reason": f"Invoice date {invoice_date} is in the future (today: {today})"
        }

    # Stale invoice check (> 2 years)
    age_days = (today - invoice_date).days
    if age_days > 730:
        return {
            "valid": False,
            "reason": f"Invoice date {invoice_date} is over 2 years old ({age_days} days)"
        }

    result = {"valid": True, "reason": "Invoice date is valid", "age_days": age_days}

    # Due date check
    if due_date_str:
        due_date = parse_date_str(due_date_str)
        if due_date and due_date < invoice_date:
            result["valid"] = False
            result["reason"] = (
                f"Due date {due_date} is before invoice date {invoice_date} — "
                "back-dated due date is a fraud signal."
            )

    return result
