from app.database import invoice_collection
from app.database import vendor_collection
from app.database import ledger_collection

invoice = invoice_collection.find_one()

print(invoice)

vendor = vendor_collection.find_one()

print(vendor)

ledger=ledger_collection.find_one()

print(ledger)