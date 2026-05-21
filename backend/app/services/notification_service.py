"""
Madhyastha — Notification Service
SMTP Email notifications with graceful fallbacks
"""
import logging
import smtplib
import re
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("madhyastha.notify")


async def send_email(to_email: str, subject: str, body: str, attachment_path: Optional[str] = None) -> bool:
    """Send email via SMTP (Gmail) with anti-spam compliant structure"""
    # Check for empty or placeholder credentials
    is_mock = (
        not settings.SMTP_USER or 
        not settings.SMTP_PASSWORD or 
        "your_email" in settings.SMTP_USER or 
        "your_app_password" in settings.SMTP_PASSWORD
    )

    if is_mock:
        logger.info(f"[MOCK EMAIL] To: {to_email} | Subject: {subject}")
        logger.info(f"[MOCK EMAIL] Body preview: {_strip_html(body)[:120]}...")
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.warning("✉ SMTP credentials missing in .env")
        else:
            logger.warning("✉ SMTP credentials are still placeholders in .env")
        return True
    try:
        # Root container — allows attachments
        msg = MIMEMultipart("mixed")
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg["Subject"] = f"[Madhyastha] {subject}"

        # Alternative container — plain text + HTML (anti-spam)
        body_container = MIMEMultipart("alternative")

        # Plain text version (auto-generated from HTML)
        plain_text = _strip_html(body)
        body_container.attach(MIMEText(plain_text, "plain"))

        # HTML version with branding
        html_body = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 20px; border-radius: 12px 12px 0 0;">
                <h2 style="color: white; margin: 0;">⚖️ Madhyastha</h2>
                <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 0.85rem;">AI-Powered Dispute Resolution</p>
            </div>
            <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                {body}
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="font-size: 0.75rem; color: #94a3b8;">
                    This is an automated message from Madhyastha AI Dispute Resolution Platform.<br/>
                    Legal Anchors: Mediation Act 2023 | Arbitration &amp; Conciliation Act 1996
                </p>
            </div>
        </div>
        """
        body_container.attach(MIMEText(html_body, "html"))

        msg.attach(body_container)

        # Attach PDF if provided
        if attachment_path and os.path.exists(attachment_path):
            with open(attachment_path, "rb") as f:
                part = MIMEBase("application", "pdf")
                part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header("Content-Disposition", f"attachment; filename={os.path.basename(attachment_path)}")
                msg.attach(part)

        # Send via SMTP
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"✉ Email sent to {to_email}: {subject}")
        return True

    except Exception as e:
        logger.error(f"✉ Email FAILED to {to_email}: {e}")
        return False


def _strip_html(html: str) -> str:
    """Strip HTML tags to produce a plain-text version for anti-spam compliance"""
    text = re.sub(r'<br\s*/?>', '\n', html)
    text = re.sub(r'<hr[^>]*>', '\n---\n', text)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\n\s*\n', '\n\n', text)
    return text.strip()


async def send_sms(phone: str, message: str) -> bool:
    """SMS placeholder — sends via email-to-SMS or logs mock.
    For production, integrate a provider like Twilio or TextLocal."""
    logger.info(f"[MOCK SMS] To: {phone} | Message: {message[:80]}...")
    return True


async def notify_parties(dispute, parties, subject: str, message: str):
    """Send notifications to all parties in a dispute"""
    html_message = f"<p>{message}</p>"
    for party in parties:
        if party.email:
            await send_email(party.email, subject, html_message)
        if party.phone:
            await send_sms(party.phone, message)


async def send_dispute_link(party_name: str, email: str, role: str, link: str, dispute_title: str):
    """Send dispute session link to a party"""
    body = f"""
    <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: #f0fff4; color: #48bb78; padding: 8px 16px; border-radius: 100px; font-weight: 700; font-size: 0.8rem; border: 1px solid #c6f6d5;">
            ✅ DISPUTE REGISTERED SUCCESSFULLY
        </div>
    </div>
    <h3>Hello {party_name},</h3>
    <p>A new dispute has been successfully registered on Madhyastha AI, and you have been named as a party in this matter:</p>
    <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin: 16px 0; border: 1px solid #e2e8f0;">
        <strong style="font-size: 1.1rem; color: #1e293b;">{dispute_title}</strong><br/>
        <div style="margin-top: 8px; color: #64748b; font-size: 0.9rem;">
            <strong>Your Role:</strong> {role.replace('_', ' ').title()}
        </div>
    </div>
    <p>As per the <strong>Mediation Act, 2023</strong>, we invite you to participate in a private AI-assisted mediation session to resolve this matter amicably before it reaches the courts.</p>
    <div style="text-align: center; margin: 32px 0;">
        <a href="{link}" style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2);
           color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            Access Private Session
        </a>
    </div>
    <p style="margin-top: 16px; font-size: 0.88rem; color: #64748b; background: #fffaf0; padding: 12px; border-radius: 8px; border: 1px solid #feebc8;">
        <strong>⚠️ Privacy Notice:</strong> This link is strictly confidential and unique to you. Accessing this link will verify your identity. Do not share it with anyone, including the other party.
    </p>
    """
    await send_email(email, f"Dispute Registered: {dispute_title}", body)


async def send_agreement_notification(party_name: str, email: str, dispute_title: str, pdf_path: Optional[str] = None):
    """Send agreement PDF to a party"""
    body = f"""
    <h3>Dear {party_name},</h3>
    <p>An agreement has been finalized for your dispute:</p>
    <div style="background: #f0fff4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #48bb78;">
        <strong>✅ {dispute_title}</strong><br/>
        <span style="color: #2d3748;">Settlement agreement is attached as PDF.</span>
    </div>
    <p>This agreement is legally binding under <strong>Section 22, Mediation Act 2023</strong>.</p>
    """
    await send_email(email, f"Agreement Finalized: {dispute_title}", body, attachment_path=pdf_path)
