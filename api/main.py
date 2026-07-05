from fastapi import FastAPI, HTTPException, Depends, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
from . import db

app = FastAPI(title="Vekan Tech Invoice API")

# Force correct MIME types for Windows (bypasses registry issues entirely)
@app.middleware("http")
async def override_static_file_mimetype(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.endswith(".js"):
        response.headers["content-type"] = "application/javascript"
    elif request.url.path.endswith(".css"):
        response.headers["content-type"] = "text/css"
    return response

# Allow CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InvoiceCreate(BaseModel):
    bill_number: int | None = None
    date: str
    po_date: str = ""
    po_number: str = ""
    to_details: str
    items: list
    subtotal: float
    sgst: float
    cgst: float
    grand_total: float
    seal_path: str | None = None
    sign_path: str | None = None

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/next_bill_number")
def get_next_bill():
    return {"next_bill_number": db.get_next_bill_number()}

@app.post("/api/invoices")
def create_invoice(invoice: InvoiceCreate):
    try:
        invoice_data = invoice.model_dump()
        
        if invoice_data.get("bill_number") is None:
            invoice_data["bill_number"] = db.get_next_bill_number()
            
        invoice_data["status"] = "active"
        
        result = db.create_invoice(invoice_data)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/invoices")
def get_invoices():
    return {"invoices": db.get_invoices()}

@app.get("/api/invoices/{invoice_id}")
def get_invoice(invoice_id: str):
    invoice = db.get_invoice(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"status": "success", "data": invoice}

@app.put("/api/invoices/{invoice_id}")
def update_invoice(invoice_id: str, invoice: InvoiceCreate):
    try:
        invoice_data = invoice.model_dump()
        result = db.update_invoice(invoice_id, invoice_data)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/invoices/{invoice_id}/upload")
async def upload_invoice_pdf(invoice_id: str, file: UploadFile = File(...)):
    try:
        content = await file.read()
        url = db.upload_pdf(invoice_id, content, file.filename)
        return {"status": "success", "url": url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Serve extracted images
extracted_images_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "extracted_images")
if os.path.exists(extracted_images_path):
    app.mount("/extracted_images", StaticFiles(directory=extracted_images_path), name="extracted_images")

# Serve React frontend if exists
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"error": "Frontend not built yet"}
