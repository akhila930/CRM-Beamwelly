from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
import os
import logging
import base64
from config import settings
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch
from reportlab.lib import colors

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class PayslipEmailRequest(BaseModel):
    employeeId: str
    employeeEmail: str
    month: str
    year: int
    payslipData: dict
    pdfBase64: Optional[str] = None

def generate_payslip_pdf(payslip_data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, 
                            rightMargin=inch/4, leftMargin=inch/4,
                            topMargin=inch/2, bottomMargin=inch/2)
    styles = getSampleStyleSheet()
    
    # Define a custom 'Small' style
    styles.add(ParagraphStyle(name='Small',
                              parent=styles['Normal'],
                              fontSize=8,
                              leading=9))
                              
    story = []

    # Title
    story.append(Paragraph(f"<b>PAYSLIP</b>", styles['h1']))
    story.append(Paragraph(f"<i>For the period: {payslip_data.get('month', '')} {payslip_data.get('year', '')}</i>", styles['h3']))
    story.append(Spacer(1, 0.2 * inch))

    # Employee Information and Payment Information (two columns)
    employee_info_data = [
        [Paragraph("<b>Employee Information</b>", styles['h4']), Paragraph("<b>Payment Information</b>", styles['h4'])]
    ]
    employee_info_table_style = [
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]
    
    emp_details = [
        f"Name: <b>{payslip_data.get('employeeName', '')}</b>",
        f"Employee ID: <b>{payslip_data.get('employeeId', '')}</b>",
        f"Department: <b>{payslip_data.get('department', 'N/A')}</b>",
        f"Email: <b>{payslip_data.get('employeeEmail', 'N/A')}</b>"
    ]
    
    # Convert paymentDate string to a displayable format if it exists
    payment_date_str = 'N/A'
    if 'paymentDate' in payslip_data:
        try:
            payment_date_obj = datetime.fromisoformat(payslip_data['paymentDate'].replace('Z', '+00:00'))
            payment_date_str = payment_date_obj.strftime('%d/%m/%Y')
        except ValueError:
            payment_date_str = payslip_data['paymentDate'] # Fallback to original if parsing fails

    payment_details = [
        f"Payment Date: <b>{payment_date_str}</b>",
        f"Payment Method: <b>Bank Transfer</b>",
        f"Bank Account: <b>XXXX-XXXX-XXXX-1234</b>"
    ]
    
    for i in range(max(len(emp_details), len(payment_details))):
        row_data = [
            Paragraph(emp_details[i], styles['Normal']) if i < len(emp_details) else '',
            Paragraph(payment_details[i], styles['Normal']) if i < len(payment_details) else ''
        ]
        employee_info_data.append(row_data)

    info_table = Table(employee_info_data, colWidths=[3*inch, 3*inch])
    info_table.setStyle(TableStyle(employee_info_table_style))
    story.append(info_table)
    story.append(Spacer(1, 0.2 * inch))

    # Earnings and Deductions
    story.append(Paragraph("<b>Earnings & Deductions</b>", styles['h4']))
    story.append(Spacer(1, 0.1 * inch))

    table_data = [
        ["Description", "Amount (₹)"]
    ]

    # Basic Salary
    table_data.append([Paragraph("Basic Salary", styles['Normal']), Paragraph(f"{payslip_data.get('basicSalary', 0):,.2f}", styles['Normal'])])

    # Store indices for styling
    earnings_header_row_index = -1
    deductions_header_row_index = -1

    # Earnings
    earnings_components = [c for c in payslip_data.get('components', []) if c.get('type') == 'earning']
    if earnings_components:
        earnings_header_row_index = len(table_data)
        table_data.append([Paragraph("<b>Earnings</b>", styles['Normal']), ''])
        for comp in earnings_components:
            table_data.append([
                Paragraph(f"{comp.get('name', '')}{ ' (%)' if comp.get('isPercentage', False) else ''}", styles['Normal']),
                Paragraph(f"{comp.get('calculatedAmount', 0):,.2f}", styles['Normal'])
            ])

    # Deductions
    deduction_components = [c for c in payslip_data.get('components', []) if c.get('type') == 'deduction']
    if deduction_components:
        deductions_header_row_index = len(table_data)
        table_data.append([Paragraph("<b>Deductions</b>", styles['Normal']), ''])
        for comp in deduction_components:
            table_data.append([
                Paragraph(f"{comp.get('name', '')}{ ' (%)' if comp.get('isPercentage', False) else ''}", styles['Normal']),
                Paragraph(f"{comp.get('calculatedAmount', 0):,.2f}", styles['Normal'])
            ])

    earnings_deductions_table = Table(table_data, colWidths=[4*inch, 2*inch])
    table_styles = [
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E0E0E0')),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#D3D3D3')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#D3D3D3')),
        ('ALIGN', (0,0), (0,-1), 'LEFT'),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
    ]

    if earnings_header_row_index != -1:
        table_styles.append(('BACKGROUND', (0, earnings_header_row_index), (-1, earnings_header_row_index), colors.HexColor('#F0F0F0')))
    if deductions_header_row_index != -1:
        table_styles.append(('BACKGROUND', (0, deductions_header_row_index), (-1, deductions_header_row_index), colors.HexColor('#F0F0F0')))

    earnings_deductions_table.setStyle(TableStyle(table_styles))

    story.append(earnings_deductions_table)
    story.append(Spacer(1, 0.2 * inch))

    # Totals
    total_data = [
        ["Total Earnings:", f"₹{payslip_data.get('totalEarnings', 0):,.2f}"],
        ["Total Deductions:", f"₹{payslip_data.get('totalDeductions', 0):,.2f}"],
        ["Net Salary:", f"₹{payslip_data.get('netSalary', 0):,.2f}"]
    ]

    totals_table = Table(total_data, colWidths=[4*inch, 2*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,-2), (-1,-2), 1, colors.black),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,-1), (-1,-1), 12),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 0.4 * inch))

    # Footer
    story.append(Paragraph("This is a computer-generated payslip and does not require a signature.", styles['Small']))
    story.append(Paragraph("For any queries, please contact the HR department.", styles['Small']))

    doc.build(story)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf

@router.post("/send-payslip")
async def send_payslip(request: PayslipEmailRequest):
    logger.info(f"Received payslip email request for employee ID: {request.employeeId}, email: {request.employeeEmail}")
    try:
        # Validate SMTP settings
        if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
            logger.error(f"SMTP credentials not configured. Username: {settings.SMTP_USERNAME}, Password: {'*****' if settings.SMTP_PASSWORD else 'None'}")
            raise HTTPException(
                status_code=500,
                detail="SMTP credentials not configured. Please check your .env file."
            )
        
        logger.info(f"SMTP settings: Host={settings.SMTP_HOST}, Port={settings.SMTP_PORT}, Username={settings.SMTP_USERNAME}")
        
        # Create email message
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_USERNAME
        msg['To'] = request.employeeEmail
        msg['Subject'] = f"Payslip for {request.month} {request.year}"

        # Create email body (professional template)
        body = f"""
        Salary Slip for {request.month}, {request.year}
        Greetings!!

        Please find attached your salary slip for the month of {request.month}, {request.year}. This document outlines your earnings, deductions, and net pay for the specified period.

        Should you have any queries or require clarification regarding the details mentioned in the slip, please feel free to reach out to the HR or Payroll team at equitywala@gmail.com.

        We appreciate your continued dedication and contribution to the organization.

        Warm regards,
        """

        msg.attach(MIMEText(body, 'plain'))

        # Attach PDF if provided, otherwise generate it
        pdf_data = None
        if request.pdfBase64:
            try:
                logger.info(f"Attaching provided PDF for employeeId {request.employeeId}")
                pdf_data = base64.b64decode(request.pdfBase64)
            except Exception as e:
                logger.error(f"Failed to decode provided PDF: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to decode provided PDF: {str(e)}"
                )
        else:
            try:
                logger.info(f"Generating PDF for employeeId {request.employeeId}")
                # Ensure payslipData has calculatedAmount for components
                for comp in request.payslipData.get('components', []):
                    if comp.get('isPercentage'):
                        comp['calculatedAmount'] = (request.payslipData.get('basicSalary', 0) * comp.get('amount', 0)) / 100
                    else:
                        comp['calculatedAmount'] = comp.get('amount', 0)
                pdf_data = generate_payslip_pdf(request.payslipData)
            except Exception as e:
                logger.error(f"Failed to generate PDF: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to generate PDF: {str(e)}"
                )
        if pdf_data:
            attachment = MIMEApplication(pdf_data, _subtype="pdf")
            attachment.add_header(
                'Content-Disposition', 
                'attachment', 
                filename=f'payslip_{request.month}_{request.year}.pdf'
            )
            msg.attach(attachment)
            logger.info(f"PDF attachment added to email")

        logger.info(f"Attempting to send payslip email to {request.employeeEmail}")

        # Connect to SMTP server and send email
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
            logger.info(f"Successfully sent payslip email to {request.employeeEmail}")

        return {"success": True, "message": "Payslip email sent successfully"}
    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP Authentication failed. Please check your credentials.")
        raise HTTPException(
            status_code=500,
            detail="Failed to authenticate with email server. Please check your SMTP credentials."
        )
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error occurred: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error occurred: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        ) 