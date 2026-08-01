SEVERITY_WEIGHTS = {
    "Critical": 35,
    "High": 25,
    "Medium": 12,
    "Low": 5,
}

def compute_risk_score(flags: list) -> tuple[float, str, float]:
    """
    Computes a 0–100 risk score from a list of validation flags.
    Returns: (risk_score, risk_level, confidence)
    """
    if not flags:
        return 4.0, "Low", 98.0

    raw_score = sum(SEVERITY_WEIGHTS.get(f.get("severity", "Low"), 5) for f in flags)
    
    # Cap at 100
    risk_score = min(round(raw_score, 1), 100.0)

    if risk_score >= 70:
        risk_level = "High"
    elif risk_score >= 30:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # Confidence inversely correlates with risk score and flag count
    confidence = round(max(60.0, 100.0 - (len(flags) * 3) - (risk_score * 0.1)), 1)

    return risk_score, risk_level, confidence
