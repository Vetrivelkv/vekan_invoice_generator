import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Warning: Failed to initialize Supabase client: {e}")
    supabase = None

def get_user_profile(user_id: str):
    response = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if response.data:
        return response.data[0]
    return None

def get_invoices():
    response = supabase.table("invoices").select("*").eq("status", "active").order("bill_number", desc=True).execute()
    return response.data

def create_invoice(invoice_data: dict):
    try:
        response = supabase.table("invoices").insert(invoice_data).execute()
        
        # Update current_bill_number sequence if successful
        bill_no = invoice_data.get("bill_number")
        if bill_no:
            current_seq = get_next_bill_number() - 1
            if int(bill_no) >= current_seq:
                # Upsert app_settings
                supabase.table("app_settings").upsert({"key": "current_bill_number", "value": int(bill_no)}).execute()
                
        return response.data
    except Exception as e:
        if "duplicate key value violates unique constraint" in str(e):
            raise Exception("Duplicate bill number detected. Please use a different bill number.")
        raise e

def get_next_bill_number():
    response = supabase.table("app_settings").select("value").eq("key", "current_bill_number").execute()
    if response.data:
        return int(response.data[0]["value"]) + 1
    return 128

def update_invoice(invoice_id: str, invoice_data: dict):
    response = supabase.table("invoices").update(invoice_data).eq("id", invoice_id).execute()
    return response.data

def get_invoice(invoice_id: str):
    response = supabase.table("invoices").select("*").eq("id", invoice_id).execute()
    if response.data:
        return response.data[0]
    return None

def upload_pdf(invoice_id: str, file_bytes: bytes, filename: str):
    path_on_supastorage = f"{invoice_id}/{filename}"
    # Use upset to overwrite if exists
    supabase.storage.from_("invoice_pdfs").upload(file=file_bytes, path=path_on_supastorage, file_options={"content-type": "application/pdf", "upsert": "true"})
    url = supabase.storage.from_("invoice_pdfs").get_public_url(path_on_supastorage)
    supabase.table("invoices").update({"pdf_url": url}).eq("id", invoice_id).execute()
    return url
