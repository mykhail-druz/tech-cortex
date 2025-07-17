import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Interface for form data
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// HTML sanitization
function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export async function POST(request: NextRequest) {
  try {
    // Get data from request
    const body: ContactFormData = await request.json();
    const { name, email, subject, message } = body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        {
          success: false,
          error: 'All fields are required',
        },
        { status: 400 }
      );
    }

    // Email validation
    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address',
        },
        { status: 400 }
      );
    }

    // Field length validation
    if (name.length > 100 || subject.length > 200 || message.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: 'One or more fields exceed maximum length',
        },
        { status: 400 }
      );
    }

    // Check environment variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('Gmail credentials not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Email service temporarily unavailable',
        },
        { status: 500 }
      );
    }

    // Create Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Verify connection
    await transporter.verify();

    // Sanitize data for security
    const sanitizedName = sanitizeText(name.trim());
    const sanitizedSubject = sanitizeText(subject.trim());
    const sanitizedMessage = sanitizeText(message.trim()).replace(/\n/g, '<br>');

    // Get IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    // Get current EST time for St. Petersburg, FL
    const estTime = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });

    // HTML email template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content { 
            padding: 30px 20px; 
          }
          .field { 
            margin-bottom: 20px; 
            border-bottom: 1px solid #eee;
            padding-bottom: 15px;
          }
          .field:last-of-type {
            border-bottom: none;
            margin-bottom: 0;
          }
          .label { 
            font-weight: 600; 
            color: #555; 
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            display: block;
          }
          .value { 
            padding: 12px 15px; 
            background: #f8f9fa; 
            border-radius: 6px; 
            border-left: 4px solid #667eea;
            font-size: 15px;
            line-height: 1.5;
          }
          .value a {
            color: #667eea;
            text-decoration: none;
          }
          .value a:hover {
            text-decoration: underline;
          }
          .message-value {
            min-height: 60px;
            white-space: pre-wrap;
          }
          .footer { 
            margin-top: 30px; 
            padding-top: 20px;
            font-size: 12px; 
            color: #888; 
            border-top: 2px solid #eee;
            background: #f8f9fa;
            padding: 20px;
          }
          .footer strong {
            color: #555;
          }
          .location-badge {
            display: inline-block;
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            margin-left: 8px;
          }
          .urgent-badge {
            background: #ff5722;
            color: white;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 New Contact Form Submission</h1>
            <p>TechCortex - St. Petersburg, FL</p>
            <span class="urgent-badge">New Lead</span>
          </div>
          <div class="content">
            <div class="field">
              <span class="label">👤 Customer Name</span>
              <div class="value">${sanitizedName}</div>
            </div>
            
            <div class="field">
              <span class="label">📧 Customer Email</span>
              <div class="value">
                <a href="mailto:${email}">${email}</a>
                <span class="location-badge">Click to Reply</span>
              </div>
            </div>
            
            <div class="field">
              <span class="label">📋 Subject</span>
              <div class="value">${sanitizedSubject}</div>
            </div>
            
            <div class="field">
              <span class="label">💬 Message</span>
              <div class="value message-value">${sanitizedMessage}</div>
            </div>
            
            <div class="footer">
              <strong>📍 Business Information:</strong><br>
              🕒 Submitted: ${estTime}<br>
              🌐 IP Address: ${ip}<br>
              💻 User Agent: ${request.headers.get('user-agent') || 'unknown'}<br>
              📍 Location: St. Petersburg, Florida, USA<br>
              ☎️ Business Phone: <a href="tel:+17272548324">+1 (727) 254-8324</a><br>
              <br>
              <strong>⚡ Next Steps:</strong><br>
              • Respond within 2 business hours during office hours<br>
              • Log this inquiry in our CRM system<br>
              • Follow up if no response within 24 hours
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text version for email clients that don't support HTML
    const textVersion = `
New Contact Form Submission - TechCortex

Customer Name: ${sanitizedName}
Email: ${email}
Subject: ${sanitizedSubject}

Message:
${message}

---
Business Information:
Submitted: ${estTime}
IP Address: ${ip}
Location: St. Petersburg, Florida, USA
Business Phone: +1 (727) 254-8324

Next Steps:
- Respond within 2 business hours during office hours
- Log this inquiry in our CRM system
- Follow up if no response within 24 hours
    `;

    // Create confirmation email template for the user
    const confirmationHtmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>We've Received Your Message - TechCortex</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content { 
            padding: 30px 20px; 
          }
          .message {
            margin-bottom: 25px;
            font-size: 16px;
            line-height: 1.6;
          }
          .message-details {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 25px;
            border-left: 4px solid #667eea;
          }
          .footer { 
            margin-top: 30px; 
            padding: 20px;
            font-size: 14px; 
            color: #666; 
            border-top: 2px solid #eee;
            background: #f8f9fa;
            text-align: center;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: #FFFFFFFF;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 15px;
            margin-bottom: 15px;
          }
          .contact-info {
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ We've Received Your Message</h1>
            <p>Thank you for contacting TechCortex</p>
          </div>
          <div class="content">
            <div class="message">
              <p>Hello ${sanitizedName},</p>
              
              <p>Thank you for reaching out to TechCortex. We've received your message and our team will review it promptly.</p>
              
              <p><strong>What happens next?</strong> We'll respond to your inquiry within 2 business hours during our office hours (Monday - Friday: 9:00 AM - 9:00 PM EST, Saturday - Sunday: 10:00 AM - 8:00 PM EST).</p>
            </div>
            
            <div class="message-details">
              <p><strong>Subject:</strong> ${sanitizedSubject}</p>
              <p><strong>Sent on:</strong> ${estTime}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="https://tech-cortex.com" class="button">Visit Our Website</a>
            </div>
            
            <div class="contact-info">
              <p>If you need immediate assistance, please call us at <a href="tel:+17272548324">(727) 254-8324</a> during business hours.</p>
              
              <p>Thank you for choosing TechCortex for your technology needs.</p>
              
              <p>Best regards,<br>
              The TechCortex Team<br>
              St. Petersburg, FL</p>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} TechCortex. All rights reserved.</p>
            <p>📍 St. Petersburg, Florida, USA</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text version of confirmation email
    const confirmationTextVersion = `
Thank you for contacting TechCortex!

Hello ${sanitizedName},

We've received your message regarding "${sanitizedSubject}" and our team will review it promptly.

What happens next? We'll respond to your inquiry within 2 business hours during our office hours:
- Monday - Friday: 9:00 AM - 9:00 PM EST
- Saturday - Sunday: 10:00 AM - 8:00 PM EST

If you need immediate assistance, please call us at (727) 254-8324 during business hours.

Thank you for choosing TechCortex for your technology needs.

Best regards,
The TechCortex Team
St. Petersburg, FL

© ${new Date().getFullYear()} TechCortex. All rights reserved.
📍 St. Petersburg, Florida, USA
    `;

    // Send email to business
    const businessMailOptions = {
      from: {
        name: 'TechCortex Contact Form - St. Petersburg, FL',
        address: process.env.GMAIL_USER,
      },
      to: process.env.CONTACT_EMAIL_TO || process.env.GMAIL_USER,
      replyTo: {
        name: sanitizedName,
        address: email,
      },
      subject: `🔔 New Lead from TechCortex Website: ${sanitizedSubject}`,
      html: htmlTemplate,
      text: textVersion,
      headers: {
        'X-Priority': '2', // High priority for business leads
        'X-Mailer': 'TechCortex Contact Form - St. Petersburg, FL',
        'X-Business-Location': 'St. Petersburg, Florida, USA',
      },
    };

    // Send email to business
    const businessInfo = await transporter.sendMail(businessMailOptions);

    console.log('Business email sent successfully:', businessInfo.messageId);
    console.log('Business email sent to:', process.env.CONTACT_EMAIL_TO || process.env.GMAIL_USER);

    // Send confirmation email to the user
    const userMailOptions = {
      from: {
        name: 'TechCortex - St. Petersburg, FL',
        address: process.env.GMAIL_USER,
      },
      to: {
        name: sanitizedName,
        address: email,
      },
      subject: `We've Received Your Message - TechCortex`,
      html: confirmationHtmlTemplate,
      text: confirmationTextVersion,
      headers: {
        'X-Mailer': 'TechCortex Automated Response',
        'X-Business-Location': 'St. Petersburg, Florida, USA',
      },
    };

    // Send confirmation email to user
    const userInfo = await transporter.sendMail(userMailOptions);

    console.log('Confirmation email sent successfully to user:', userInfo.messageId);
    console.log('Confirmation email sent to:', email);

    return NextResponse.json({
      success: true,
      message:
        "Message sent successfully! We'll get back to you within 2 business hours during office hours.",
      messageId: businessInfo.messageId,
    });
  } catch (error) {
    console.error('Error sending email:', error);

    // Different error types
    let errorMessage = 'A technical error occurred while sending your message';

    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        errorMessage = 'Email service authentication error';
      } else if (error.message.includes('connect')) {
        errorMessage = 'Email server connection error';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: 'Method not supported' }, { status: 405 });
}
