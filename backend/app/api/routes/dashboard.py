from fastapi import APIRouter, HTTPException
from app.database.mongodb import get_database
from bson import ObjectId
from datetime import datetime

router = APIRouter()


@router.get("/dashboard/summary", summary="Get dashboard summary counts")
async def get_dashboard_summary():
    db = get_database()
    if db is None:
        return {
            "processed": 0,
            "risks_detected": 0,
            "pending_review": 0,
            "duplicates": 0,
            "gst_errors": 0,
            "ledger_misses": 0
        }
    try:
        # Processed: Total invoices scanned
        processed = await db["invoices"].count_documents({})
        
        # Risks Detected: Count in audit_results where riskScore > 30 or risk.risk_score > 30
        risks_detected = await db["audit_results"].count_documents({
            "$or": [
                {"riskScore": {"$gt": 30}},
                {"risk.risk_score": {"$gt": 30}}
            ]
        })
        
        # Pending Review: Count in audit_results where status == "Pending Review" or status == "Open"
        pending_review = await db["audit_results"].count_documents({
            "status": {"$in": ["Pending Review", "Open"]}
        })
        
        # Duplicates: Count in audit_results where duplicate_invoice == true or matching issues
        duplicates = await db["audit_results"].count_documents({
            "$or": [
                {"duplicate_invoice": True},
                {"issues": "Duplicate Invoice"},
                {"exceptions.check": "Duplicate Invoice"}
            ]
        })
        
        # GST Errors: Count in audit_results where gst_validation == false or matching issues
        gst_errors = await db["audit_results"].count_documents({
            "$or": [
                {"gst_validation": False},
                {"issues": {"$in": ["Invalid GSTIN", "GST Validation"]}},
                {"exceptions.check": "GST Validation"}
            ]
        })
        
        # Ledger Misses: Count in audit_results where ledger_match == false or matching issues
        ledger_misses = await db["audit_results"].count_documents({
            "$or": [
                {"ledger_match": False},
                {"issues": {"$in": ["Missing in Purchase Ledger", "Ledger Missing", "Missing Purchase Ledger Entry"]}},
                {"exceptions.check": "Ledger Missing"}
            ]
        })
        
        return {
            "processed": processed,
            "risks_detected": risks_detected,
            "pending_review": pending_review,
            "duplicates": duplicates,
            "gst_errors": gst_errors,
            "ledger_misses": ledger_misses
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")


@router.get("/dashboard/stats", summary="Get dashboard metrics from MongoDB (compatible with old frontend)")
async def get_dashboard_stats():
    summary = await get_dashboard_summary()
    return {
        "invoices_processed": summary["processed"],
        "risks_detected": summary["risks_detected"],
        "pending_review": summary["pending_review"],
        "duplicate_invoices": summary["duplicates"],
        "gst_errors": summary["gst_errors"],
        "ledger_mismatches": summary["ledger_misses"],
    }


@router.get("/dashboard/monthly-trend", summary="Get monthly processed and flagged invoices trend")
async def get_dashboard_monthly_trend():
    db = get_database()
    if db is None:
        return []
    try:
        # Load all invoices to map invoiceNumber -> date
        cursor = db["invoices"].find({})
        invoices = await cursor.to_list(length=1000)
        inv_date_map = {}
        for inv in invoices:
            inv_no = inv.get("invoiceNumber") or inv.get("invoice_number") or inv.get("invoiceNo")
            if not inv_no:
                continue
            date_val = inv.get("invoiceDate") or inv.get("upload_time") or inv.get("created_at") or inv.get("invoice_date")
            if date_val:
                inv_date_map[inv_no] = str(date_val)

        # Load all audit_results
        cursor_audit = db["audit_results"].find({})
        audit_results = await cursor_audit.to_list(length=1000)

        month_order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        counts = {m: {"processed": 0, "flagged": 0} for m in month_order}

        for audit in audit_results:
            inv_no = audit.get("invoiceNumber") or audit.get("invoice_number") or audit.get("invoiceNo")
            
            date_str = None
            if audit.get("timestamp"):
                date_str = str(audit["timestamp"])
            elif audit.get("invoiceDate"):
                date_str = str(audit["invoiceDate"])
            elif inv_no and inv_no in inv_date_map:
                date_str = inv_date_map[inv_no]
            
            month_name = None
            if date_str:
                for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f", "%d-%m-%Y"):
                    try:
                        clean_str = date_str.split("T")[0] if "T" in date_str and fmt == "%Y-%m-%d" else date_str
                        if "+" in clean_str:
                            clean_str = clean_str.split("+")[0]
                        dt = datetime.strptime(clean_str, fmt)
                        month_name = dt.strftime("%b")
                        break
                    except Exception:
                        pass
            
            if not month_name:
                month_name = "Jul"  # default fallback

            risk_score = audit.get("riskScore")
            if risk_score is None and audit.get("risk"):
                risk_score = audit["risk"].get("risk_score")
            if risk_score is None:
                risk_score = 0
            
            is_flagged = risk_score > 30

            if month_name in counts:
                counts[month_name]["processed"] += 1
                if is_flagged:
                    counts[month_name]["flagged"] += 1

        result = []
        for m in month_order:
            result.append({
                "month": m,
                "name": m,
                "processed": counts[m]["processed"],
                "flagged": counts[m]["flagged"]
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")


@router.get("/dashboard/anomalies", summary="Get breakdown of anomalies by category")
async def get_dashboard_anomalies():
    db = get_database()
    if db is None:
        return []
    try:
        cursor = db["audit_results"].find({})
        audit_results = await cursor.to_list(length=1000)

        counts = {
            "Duplicate Invoice": 0,
            "GST Error": 0,
            "Amount Mismatch": 0,
            "Date Mismatch": 0,
            "Vendor Mismatch": 0,
            "Ledger Missing": 0
        }

        for audit in audit_results:
            issues = audit.get("issues") or []
            exceptions = audit.get("exceptions") or []
            
            checks = []
            for ex in exceptions:
                if isinstance(ex, dict):
                    checks.append(ex.get("check") or "")
                else:
                    checks.append(str(ex))

            def has_issue(keywords):
                return any(k.lower() in [i.lower() for i in issues] or k.lower() in [c.lower() for c in checks] for k in keywords)

            if has_issue(["Duplicate Invoice"]) or audit.get("duplicate_invoice") is True:
                counts["Duplicate Invoice"] += 1
            if has_issue(["GST Validation", "Invalid GSTIN"]) or audit.get("gst_validation") is False:
                counts["GST Error"] += 1
            if has_issue(["Amount Mismatch"]):
                counts["Amount Mismatch"] += 1
            if has_issue(["Date Anomaly", "Date Mismatch"]):
                counts["Date Mismatch"] += 1
            if has_issue(["Vendor Verification", "Vendor Not Found"]):
                counts["Vendor Mismatch"] += 1
            if has_issue(["Ledger Missing", "Missing in Purchase Ledger", "Missing Purchase Ledger Entry"]) or audit.get("ledger_match") is False:
                counts["Ledger Missing"] += 1

        result = []
        for cat, val in counts.items():
            result.append({
                "category": cat,
                "name": cat,
                "value": val,
                "count": val
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")


@router.get("/dashboard/flagged", summary="Get highest risk invoices")
async def get_dashboard_flagged():
    db = get_database()
    if db is None:
        return []
    try:
        # Fetch highest risk invoices (sort by riskScore / risk_score descending)
        cursor = db["invoices"].find({}).sort([("riskScore", -1), ("risk_score", -1)]).limit(10)
        invoices = await cursor.to_list(length=10)
        for inv in invoices:
            if "_id" in inv:
                inv["_id"] = str(inv["_id"])
        return invoices
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")


@router.get("/dashboard/activity", summary="Get recent audit logs activity feed")
async def get_dashboard_activity(limit: int = 10):
    db = get_database()
    if db is None:
        return []
    try:
        cursor = db["audit_results"].find({}).sort("timestamp", -1).limit(limit)
        events = await cursor.to_list(length=limit)
        
        formatted_events = []
        for idx, ev in enumerate(events):
            if "_id" in ev:
                ev["_id"] = str(ev["_id"])
            
            invoice_no = ev.get("invoiceNumber") or ev.get("extracted_fields", {}).get("invoice_number") or "N/A"
            risk_level = ev.get("riskLevel") or ev.get("risk", {}).get("risk_level") or "Low"
            score = ev.get("riskScore") or ev.get("risk", {}).get("risk_score") or 0
            
            sev = "Info"
            if risk_level == "High" or risk_level == "Critical":
                sev = "Critical"
            elif risk_level == "Medium":
                sev = "Warning"

            action = "Invoice Analyzed"
            issues = ev.get("issues") or []
            exceptions = ev.get("exceptions") or []
            checks = [ex.get("check") for ex in exceptions if isinstance(ex, dict)] if exceptions else []
            
            if issues or checks:
                action = "Anomaly Flags Raised"
                all_issues = list(issues) + list(checks)
                details = f"Anomaly detected: {', '.join(all_issues)} on invoice {invoice_no}."
            else:
                conf = ev.get("confidence") or ev.get("risk", {}).get("confidence") or 100.0
                details = f"OCR extraction completed. Confidence: {conf:.1f}%. Risk score: {score}%."

            formatted_events.append({
                "id": ev.get("_id") or f"act-{idx}",
                "timestamp": ev.get("timestamp") or "",
                "action": action,
                "user": ev.get("user") or "AI Engine",
                "targetType": "Invoice",
                "targetId": invoice_no,
                "details": details,
                "severity": sev
            })
            
        return formatted_events
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")
