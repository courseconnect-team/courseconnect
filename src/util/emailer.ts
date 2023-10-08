import * as nodemailer from 'nodemailer';
import { MailOptions } from 'nodemailer/lib/json-transport';

export class Emailer {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });
  }

  public sendEmail(mailOptions: MailOptions) {
    return this.transporter.sendMail(mailOptions);
  }

  public notifyUserForSignup(email: string, username: string) {
    this.sendEmail(this.newUserEmailTemplate(email, username));
  }

  private newUserEmailTemplate(email: string, username: string) {
    return {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `Welcome, ${username}!`,
      text: 'Welcome to our website!',
      html: `
        <h1>Welcome, ${username}!</h1>
        <p>We're glad you've joined us. We hope you find everything you're looking for here and enjoy using our site.</p>
        <p>If you have any questions or need any help, please don't hesitate to contact us. Thank you for signing up!</p>
      `,
    } as MailOptions;
  }
}
