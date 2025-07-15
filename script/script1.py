import fitz
import os
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from tempfile import NamedTemporaryFile

# ------------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------------
TEMPLATE_PDF   = "certTemp.pdf"
OUTPUT_PDF     = "final_cert.pdf"
FONT_TTF       = "TheNautigal-Regular.ttf"      # Nautigal TTF
STUDENT_NAME   = "Vayras"
COMPLETION_DATE = "18th MAR 2025"

# ------------------------------------------------------------------
# STEP 1 – create overlay that ONLY contains the big script name
# ------------------------------------------------------------------
def create_overlay_pdf(width, height, name, font_path):
    pdfmetrics.registerFont(TTFont("Nautigal", font_path))

    tmp = NamedTemporaryFile(delete=False, suffix=".pdf")
    tmp.close()

    c = canvas.Canvas(tmp.name, pagesize=(width, height))
    c.setFillColorRGB(0, 0, 0)

    # Large script name (The Nautigal)
    c.setFont("Nautigal", 450)
    c.drawString(1080, 990, name)

    c.save()
    return tmp.name

# ------------------------------------------------------------------
# STEP 2 – open template, stamp overlay, add Helvetica text
# ------------------------------------------------------------------
def generate_certificate():
    if not os.path.exists(TEMPLATE_PDF):
        print(f"❌ Missing template: {TEMPLATE_PDF}"); return
    if not os.path.exists(FONT_TTF):
        print(f"❌ Missing font: {FONT_TTF}"); return

    doc   = fitz.open(TEMPLATE_PDF)
    page  = doc[0]
    width, height = page.rect.width, page.rect.height

    # Overlay with big script name
    overlay_path = create_overlay_pdf(width, height, STUDENT_NAME, FONT_TTF)
    overlay_doc  = fitz.open(overlay_path)
    page.show_pdf_page(page.rect, overlay_doc, 0)
    overlay_doc.close()
    os.unlink(overlay_path)

    # Smaller signature‑line name in Helvetica
    page.insert_text(
        fitz.Point(1450, 1381),
        STUDENT_NAME,
        fontsize = 50,
        color    = (0, 0, 0),
        fontname = "helv"
    )

    # Completion date
    page.insert_text(
        fitz.Point(710, 1580),
        COMPLETION_DATE,
        fontsize = 60,
        color    = (0, 0, 0),
        fontname = "helv"
    )

    doc.save(OUTPUT_PDF)
    doc.close()
    print(f"✅ Created: {OUTPUT_PDF}")

# ------------------------------------------------------------------
# RUN
# ------------------------------------------------------------------
generate_certificate()
