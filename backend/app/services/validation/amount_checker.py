def check_amount(taxable_amount: float, tax_amount: float, total_amount: float,
                 tolerance: float = 1.0) -> dict:
    """
    Validates that taxable_amount + tax_amount ≈ total_amount within tolerance.
    """
    if total_amount <= 0:
        return {"valid": False, "reason": "Total amount is zero or missing"}

    calculated_total = taxable_amount + tax_amount
    diff = abs(calculated_total - total_amount)

    if diff <= tolerance:
        return {
            "valid": True,
            "reason": f"Amounts are consistent. Calculated: {calculated_total:.2f}, Stated: {total_amount:.2f}"
        }
    else:
        return {
            "valid": False,
            "reason": (
                f"Amount mismatch: taxable ({taxable_amount:.2f}) + tax ({tax_amount:.2f}) "
                f"= {calculated_total:.2f}, but invoice states {total_amount:.2f} "
                f"(difference: {diff:.2f})"
            )
        }
