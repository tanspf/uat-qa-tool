import os

# Minimal PDF generator in pure Python without third party dependencies
def create_pdf(filename, title, content_lines):
    # Standard minimal PDF structure
    objects = []
    
    # 1: Catalog
    objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    # 2: Pages
    objects.append(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
    # 3: Page
    objects.append(b"3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n")
    # 4: Font
    objects.append(b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")
    
    # Construct stream text
    stream_content = f"BT /F1 18 Tf 50 740 Td ({title}) Tj ET\n"
    y = 700
    for line in content_lines:
        line_clean = line.replace("(", "\\(").replace(")", "\\)")
        stream_content += f"BT /F1 11 Tf 50 {y} Td ({line_clean}) Tj ET\n"
        y -= 20
        
    stream_bytes = stream_content.encode('latin-1', errors='replace')
    stream_obj = f"5 0 obj\n<< /Length {len(stream_bytes)} >>\nstream\n".encode('latin-1') + stream_bytes + b"\nendstream\nendobj\n"
    objects.append(stream_obj)
    
    # Calculate xref
    pdf_data = b"%PDF-1.4\n"
    offsets = [0]
    for obj in objects:
        offsets.append(len(pdf_data))
        pdf_data += obj
        
    xref_offset = len(pdf_data)
    pdf_data += b"xref\n0 6\n0000000000 65535 f \n"
    for off in offsets[1:]:
        pdf_data += f"{off:010d} 00000 n \n".encode('latin-1')
        
    pdf_data += f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF".encode('latin-1')
    
    with open(filename, "wb") as f:
        f.write(pdf_data)
    print(f"Generated {filename} successfully ({len(pdf_data)} bytes)")

if __name__ == "__main__":
    os.makedirs("sample_prd", exist_ok=True)
    create_pdf(
        "sample_prd/PRD_FoodDelivery_VN.pdf",
        "PRD: Food Delivery App - Vietnam Market (v1.2)",
        [
            "SECTION 1: BUYER ORDER PLACEMENT (VN SCOPE)",
            "Requirement 1.1: Cash on Delivery (COD) and E-Wallet Payment",
            "Buyer in Vietnam can select COD, MoMo, or ZaloPay at checkout.",
            "Expected Result: Order created successfully with status PENDING_MERCHANT.",
            "Evidence: Screenshot of Order Summary UI and API response payload from /orders/create.",
            "",
            "Requirement 1.2: Free Shipping Coupon VN",
            "Applying FREESHIP_VN code must discount shipping fee to 0 VND.",
            "Expected Result: Shipping fee shows 0 VND in order summary before payment.",
            "Evidence: Screenshot of payment screen showing 0 VND shipping fee line item.",
            "",
            "SECTION 2: MERCHANT ORDER MANAGEMENT",
            "Requirement 2.1: Accept Order Notification",
            "Merchant receives push notification when new order arrives and clicks Accept.",
            "Expected Result: Status changes to PREPARING and driver search is triggered.",
            "Evidence: Screen recording of Merchant app receiving notification and clicking Accept.",
            "",
            "SECTION 3: DRIVER PICKUP & DELIVERY",
            "Requirement 3.1: GPS Location Update",
            "Driver location updates on Buyer tracking map every 5 seconds.",
            "Expected Result: Buyer map shows driver icon moving along route in real-time.",
            "Evidence: Screen recording of Buyer live map tracking screen."
        ]
    )
