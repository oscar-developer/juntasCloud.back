import { Injectable, InternalServerErrorException } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

type SendEmailVerificationInput = {
  email: string;
  token: string;
  expiresInHours: number;
};

type SendPasswordResetInput = {
  email: string;
  token: string;
  expiresInHours: number;
};

@Injectable()
export class MailService {
  async sendEmailVerification(
    input: SendEmailVerificationInput,
  ): Promise<void> {
    const config = this.getSmtpConfig();
    const verificationUrl = this.buildFrontendUrl(
      config.frontendBaseUrl,
      '/verify-email',
      input.token,
    );

    const transporter: Transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    const subject = 'Verifica tu cuenta en JuntasCloud';
    const text = [
      'Hola,',
      '',
      `Para verificar tu cuenta, abre este enlace: ${verificationUrl}`,
      `Este enlace expira en ${input.expiresInHours} horas.`,
    ].join('\n');
    const html = `<p>Hola,</p><p>Para verificar tu cuenta, haz clic en el siguiente enlace:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p><p>Este enlace expira en ${input.expiresInHours} horas.</p>`;

    try {
      await transporter.sendMail({
        from: config.from,
        to: input.email,
        subject,
        text,
        html,
      });
    } catch {
      throw new InternalServerErrorException(
        'No se pudo enviar el correo de verificacion. Intentalo nuevamente.',
      );
    }
  }

  async sendPasswordReset(input: SendPasswordResetInput): Promise<void> {
    const config = this.getSmtpConfig();
    const resetUrl = this.buildFrontendUrl(
      config.frontendBaseUrl,
      '/reset-password',
      input.token,
    );

    const transporter: Transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    const subject = 'Recupera tu contrasena en JuntasCloud';
    const text = [
      'Hola,',
      '',
      `Para restablecer tu contrasena, abre este enlace: ${resetUrl}`,
      `Este enlace expira en ${input.expiresInHours} horas.`,
      'Si no solicitaste este cambio, ignora este correo.',
    ].join('\n');
    const html = `<p>Hola,</p><p>Para restablecer tu contrasena, haz clic en el siguiente enlace:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Este enlace expira en ${input.expiresInHours} horas.</p><p>Si no solicitaste este cambio, ignora este correo.</p>`;

    try {
      await transporter.sendMail({
        from: config.from,
        to: input.email,
        subject,
        text,
        html,
      });
    } catch {
      throw new InternalServerErrorException(
        'No se pudo enviar el correo de recuperacion. Intentalo nuevamente.',
      );
    }
  }

  private getSmtpConfig(): {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
    frontendBaseUrl: string;
  } {
    const host = process.env.SMTP_HOST;
    const portRaw = process.env.SMTP_PORT;
    const secureRaw = process.env.SMTP_SECURE;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM;
    const frontendBaseUrl = process.env.FRONTEND_BASE_URL;

    if (!host || !portRaw || !user || !pass || !from || !frontendBaseUrl) {
      throw new InternalServerErrorException(
        'Faltan variables SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM o FRONTEND_BASE_URL.',
      );
    }

    const port = Number(portRaw);
    if (!Number.isInteger(port) || port <= 0) {
      throw new InternalServerErrorException(
        'SMTP_PORT debe ser un entero positivo.',
      );
    }

    const secure = this.parseBoolean(secureRaw, port === 465);

    return {
      host,
      port,
      secure,
      user,
      pass,
      from,
      frontendBaseUrl,
    };
  }

  private buildFrontendUrl(
    frontendBaseUrl: string,
    targetPath: string,
    token: string,
  ): string {
    const url = new URL(frontendBaseUrl);
    const currentPath = url.pathname.replace(/\/+$/, '');
    const normalizedPath = targetPath.startsWith('/')
      ? targetPath
      : `/${targetPath}`;
    url.pathname = `${currentPath}${normalizedPath}`;
    url.searchParams.set('token', token);
    return url.toString();
  }

  private parseBoolean(
    rawValue: string | undefined,
    defaultValue: boolean,
  ): boolean {
    if (rawValue === undefined || rawValue === null || rawValue.trim() === '') {
      return defaultValue;
    }

    const normalized = rawValue.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
      return true;
    }
    if (normalized === 'false' || normalized === '0' || normalized === 'no') {
      return false;
    }

    throw new InternalServerErrorException(
      'SMTP_SECURE debe ser true/false (o 1/0).',
    );
  }
}
