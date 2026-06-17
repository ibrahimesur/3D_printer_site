import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def send_reset_password_email(to_email: str, token: str):
    smtp_host = getattr(settings, "SMTP_HOST", None)
    smtp_port = getattr(settings, "SMTP_PORT", 587)
    smtp_user = getattr(settings, "SMTP_USER", None)
    smtp_pass = getattr(settings, "SMTP_PASSWORD", None)

    if not all([smtp_host, smtp_user, smtp_pass]):
        logger.error("SMTP settings are not configured. Email not sent.")
        return False

    sender_email = smtp_user
    # Frontend dev'de localhost port 3000, production'da filamengo.com
    # Ancak backend'den frontend base URL'i tam bilemeyebiliriz, bu yüzden absolute url kullanacağız.
    reset_link = f"https://filamengo.com/auth/reset-password?token={token}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Filamengo Şifre Sıfırlama"
    msg["From"] = f"Filamengo <{sender_email}>"
    msg["To"] = to_email

    text = f"Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:\n\n{reset_link}\n\nEğer bu isteği siz yapmadıysanız lütfen bu e-postayı dikkate almayın."
    
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #4CAF50;">Filamengo Şifre Sıfırlama</h2>
        <p>Merhaba,</p>
        <p>Şifrenizi sıfırlamak için bir istek aldık. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
        <p style="margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Şifremi Sıfırla</a>
        </p>
        <p>Eğer butona tıklayamıyorsanız, aşağıdaki linki kopyalayıp tarayıcınıza yapıştırabilirsiniz:</p>
        <p><a href="{reset_link}">{reset_link}</a></p>
        <p>Eğer bu isteği siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.</p>
        <hr style="border: 1px solid #eee; margin-top: 30px;">
        <p style="font-size: 12px; color: #888;">&copy; 2024 Filamengo</p>
      </body>
    </html>
    """

    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")

    msg.attach(part1)
    msg.attach(part2)

    try:
        port = int(smtp_port)
        if port == 465:
            with smtplib.SMTP_SSL(smtp_host, port) as server:
                server.login(smtp_user, smtp_pass)
                server.sendmail(sender_email, to_email, msg.as_string())
        else:
            with smtplib.SMTP(smtp_host, port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(sender_email, to_email, msg.as_string())
        return True
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return False
