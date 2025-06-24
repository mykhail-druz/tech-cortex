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
              ☎️ Business Phone: <a href="tel:+17275589452">+1 (727) 558-9452</a><br>
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
Business Phone: +1 (727) 558-9452

Next Steps:
- Respond within 2 business hours during office hours
- Log this inquiry in our CRM system
- Follow up if no response within 24 hours
    `;

    // Send email
    const mailOptions = {
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

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);
    console.log('Email sent to:', process.env.CONTACT_EMAIL_TO || process.env.GMAIL_USER);

    return NextResponse.json({
      success: true,
      message:
        "Message sent successfully! We'll get back to you within 2 business hours during office hours.",
      messageId: info.messageId,
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
