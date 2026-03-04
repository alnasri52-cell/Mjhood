import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,       // ab@mjhood.com
        pass: process.env.SMTP_PASSWORD,    // App Password from Google
    },
});

// Simple in-memory rate limiter (resets on deploy)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 3;          // max requests
const RATE_WINDOW = 60 * 1000; // per minute

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
        return false;
    }

    if (entry.count >= RATE_LIMIT) {
        return true;
    }

    entry.count++;
    return false;
}

export async function POST(req: NextRequest) {
    try {
        // Rate limit by IP
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || req.headers.get('x-real-ip')
            || 'unknown';

        if (isRateLimited(ip)) {
            return NextResponse.json(
                { error: 'Too many requests. Please wait a minute before trying again.' },
                { status: 429 }
            );
        }

        const { name, email, message } = await req.json();

        if (!name || !email || !message) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // Basic input sanitization
        if (name.length > 200 || email.length > 200 || message.length > 5000) {
            return NextResponse.json({ error: 'Input too long' }, { status: 400 });
        }

        await transporter.sendMail({
            from: `"Mjhood Contact" <${process.env.SMTP_EMAIL}>`,
            to: 'ab@mjhood.com',
            subject: `New Contact Message from ${name}`,
            replyTo: email,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #33A9E0; border-bottom: 2px solid #33A9E0; padding-bottom: 10px;">
                        📬 New Contact Message
                    </h2>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #555; width: 80px;">Name:</td>
                            <td style="padding: 8px 0; color: #333;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                            <td style="padding: 8px 0; color: #333;">
                                <a href="mailto:${email}" style="color: #33A9E0;">${email}</a>
                            </td>
                        </tr>
                    </table>
                    <div style="margin-top: 20px; padding: 16px; background-color: #f5f5f5; border-radius: 8px;">
                        <p style="font-weight: bold; color: #555; margin: 0 0 8px 0;">Message:</p>
                        <p style="color: #333; margin: 0; white-space: pre-wrap;">${message}</p>
                    </div>
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">
                        Sent via Mjhood Contact Form • Reply directly to respond to ${name}
                    </p>
                </div>
            `,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Contact email error:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
