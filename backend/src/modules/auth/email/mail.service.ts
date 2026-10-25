import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import type { Env } from '../../../config/env.validation.js';

// The verification email, branded as Connect Four. Inline styles and a table
// layout, because mail clients ignore <style> blocks and modern CSS.
function codeHtml(code: string, intro: string): string {
  const digits = code
    .split('')
    .map(
      (d) =>
        `<td style="width:44px;height:56px;margin:0 3px;background:#0f172a;border-radius:10px;color:#fbbf24;font:700 30px/56px monospace;text-align:center">${d}</td>`,
    )
    .join('<td style="width:6px"></td>');
  return `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" align="center" width="100%" style="max-width:480px;background:#1e3a8a;border-radius:16px;overflow:hidden">
<tr><td style="padding:24px 24px 8px;text-align:center">
<span style="font-size:22px;color:#ef4444">&#9679;</span><span style="font-size:22px;color:#fbbf24">&#9679;</span><span style="font-size:22px;color:#ef4444">&#9679;</span><span style="font-size:22px;color:#fbbf24">&#9679;</span>
<div style="margin-top:6px;font-size:26px;font-weight:700;color:#ffffff">Connect Four</div></td></tr>
<tr><td style="padding:8px 24px 0;text-align:center;color:#dbeafe;font-size:15px;line-height:22px">${intro}</td></tr>
<tr><td style="padding:20px 24px"><table role="presentation" align="center"><tr>${digits}</tr></table></td></tr>
<tr><td style="padding:0 24px 24px;text-align:center;color:#93c5fd;font-size:13px;line-height:20px">The code is valid for 15 minutes.<br>If this was not you, you can ignore this email.</td></tr>
</table></body></html>`;
}

// Sends the verification code through Gmail SMTP (needs an app password).
// Without SMTP_USER the code is only printed in the log, so development and
// tests work with no Gmail account.
@Injectable()
export class MailService {
  private readonly log = new Logger(MailService.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  sendVerification(to: string, code: string): Promise<void> {
    return this.sendCode(to, code, {
      subject: `${code} is your Connect Four verification code`,
      intro: 'Welcome! Enter this code to verify your email and activate your account.',
    });
  }

  sendPasswordReset(to: string, code: string): Promise<void> {
    return this.sendCode(to, code, {
      subject: `${code} is your Connect Four password reset code`,
      intro: 'Enter this code to choose a new password for your account.',
    });
  }

  sendTwoFactorAuth(to: string, code: string): Promise<void> {
    return this.sendCode(to, code, {
      subject: `${code} is your Connect Four login code`,
      intro: 'Enter this code to finish logging in to your account.',
    });
  }

  private async sendCode(
    to: string,
    code: string,
    { subject, intro }: { subject: string; intro: string },
  ): Promise<void> {
    const user = this.config.get('SMTP_USER', { infer: true });
    if (!user) {
      this.log.log(`Code for ${to}: ${code} (${subject})`);
      return;
    }
    const transport = createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass: this.config.get('SMTP_PASSWORD', { infer: true }) },
    });
    await transport.sendMail({
      from: `"Connect Four" <${user}>`,
      to,
      subject,
      text: `${intro}\n\nYour code: ${code}\n\nIt is valid for 15 minutes. If this was not you, ignore this email.`,
      html: codeHtml(code, intro),
    });
  }
}
