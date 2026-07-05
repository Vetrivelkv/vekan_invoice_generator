from fpdf import FPDF
from num2words import num2words
import os

class InvoicePDF(FPDF):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.set_auto_page_break(auto=True, margin=15)
        
    def header(self):
        # We can draw the header here or in the main generate function
        pass

    def footer(self):
        pass

def generate_invoice_pdf(invoice_data: dict, output_path: str):
    pdf = InvoicePDF()
    pdf.add_page()
    
    # 1. Letterhead
    pdf.set_font("Times", "B", 24)
    pdf.set_text_color(20, 20, 150) # Blueish
    pdf.cell(0, 15, "Vekan Tech Enterprises", ln=True, align="C")
    
    pdf.set_font("Times", "", 10)
    pdf.set_text_color(0, 0, 0)
    # Parse letterhead details if passed or use default
    pdf.cell(0, 5, "No.10 Thanthai Periyar Nagar, Kumananchavadi, Chennai-56.", ln=True, align="C")
    pdf.cell(0, 5, "Phone: 9841644475, 8939062876", ln=True, align="C")
    pdf.cell(0, 5, "GSTIN:33AKIPK1425D1ZQ.", ln=True, align="C")
    pdf.line(10, 40, 200, 40)
    
    pdf.ln(10)
    
    # 2. Right Top Details
    pdf.set_font("Times", "B", 12)
    pdf.cell(100, 10, "TAX INVOICE", border=0, align="L")
    
    # Details Box
    pdf.set_font("Times", "", 10)
    details_x = 130
    pdf.set_xy(details_x, pdf.get_y())
    pdf.cell(0, 5, f"Date: {invoice_data.get('date', '')}", ln=True)
    pdf.set_x(details_x)
    pdf.cell(0, 5, f"Bill No: {invoice_data.get('bill_number', '')}", ln=True)
    
    if invoice_data.get('po_number'):
        pdf.set_x(details_x)
        pdf.cell(0, 5, f"PO NO: {invoice_data.get('po_number')}", ln=True)
    if invoice_data.get('po_date'):
        pdf.set_x(details_x)
        pdf.cell(0, 5, f"PO DATE: {invoice_data.get('po_date')}", ln=True)
        
    pdf.ln(10)
    
    # 3. To Section
    pdf.set_font("Times", "B", 10)
    pdf.set_text_color(20, 20, 150)
    pdf.cell(0, 5, "TO", ln=True)
    
    pdf.set_text_color(0, 0, 0)
    to_lines = invoice_data.get('to_details', '').split('\n')
    if to_lines:
        pdf.set_font("Times", "B", 11)
        pdf.cell(0, 6, to_lines[0], ln=True) # Company name
        pdf.set_font("Times", "", 10)
        for line in to_lines[1:]:
            pdf.cell(0, 5, line, ln=True)
            
    pdf.ln(10)
    
    # 4. Table
    pdf.set_fill_color(30, 60, 100)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Times", "B", 10)
    
    col_widths = [15, 85, 20, 35, 35]
    headers = ["S.No.", "Description", "Qty", "Rate (INR)", "Amount (INR)"]
    
    for i in range(len(headers)):
        pdf.cell(col_widths[i], 10, headers[i], border=1, fill=True, align="C")
    pdf.ln()
    
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Times", "", 10)
    
    items = invoice_data.get('items', [])
    for idx, item in enumerate(items, 1):
        pdf.cell(col_widths[0], 10, str(idx), border=1, align="C")
        pdf.cell(col_widths[1], 10, item.get('description', ''), border=1)
        pdf.cell(col_widths[2], 10, str(item.get('qty', '')), border=1, align="C")
        pdf.cell(col_widths[3], 10, str(item.get('rate', '')), border=1, align="R")
        pdf.cell(col_widths[4], 10, str(item.get('amount', '')), border=1, align="R")
        pdf.ln()
        
    # Subtotal, SGST, CGST rows
    subtotal = invoice_data.get('subtotal', 0)
    sgst = invoice_data.get('sgst', 0)
    cgst = invoice_data.get('cgst', 0)
    grand_total = invoice_data.get('grand_total', 0)
    
    def add_total_row(label, value):
        pdf.cell(sum(col_widths[:-1]), 10, label, border=1, align="R")
        pdf.cell(col_widths[-1], 10, f"{value:.2f}", border=1, align="R")
        pdf.ln()
        
    add_total_row("Sub Total", subtotal)
    add_total_row("CGST 9%", cgst)
    add_total_row("SGST 9%", sgst)
    
    pdf.set_font("Times", "B", 10)
    pdf.set_fill_color(220, 230, 240)
    pdf.cell(sum(col_widths[:-1]), 10, "TOTAL", border=1, fill=True, align="R")
    pdf.cell(col_widths[-1], 10, f"{grand_total:.2f}", border=1, fill=True, align="R")
    pdf.ln(15)
    
    # 5. Amount in words
    amount_words = num2words(grand_total, lang='en_IN').replace(',', '').title()
    pdf.set_font("Times", "B", 10)
    pdf.cell(0, 5, f"Amount in words: Rupees {amount_words} Only", ln=True)
    
    pdf.ln(20)
    
    # 6. Signatures & Seals
    y_before_sign = pdf.get_y()
    
    # Place Seal
    seal_path = invoice_data.get('seal_path')
    if seal_path and os.path.exists(seal_path):
        pdf.image(seal_path, x=80, y=y_before_sign, w=30)
        
    pdf.set_xy(140, y_before_sign)
    pdf.cell(50, 5, "For Vekan Tech Enterprises", ln=True, align="C")
    
    sign_path = invoice_data.get('sign_path')
    if sign_path and os.path.exists(sign_path):
        pdf.image(sign_path, x=150, y=y_before_sign + 10, w=30)
    
    pdf.set_xy(140, y_before_sign + 30)
    pdf.cell(50, 5, "Authorized Signatory", align="C")
    
    pdf.output(output_path)
    return output_path
