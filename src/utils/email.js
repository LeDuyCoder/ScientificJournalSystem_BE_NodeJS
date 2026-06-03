import { google } from 'googleapis';
import logger from './logger.js';

const OAuth2 = google.auth.OAuth2;

// ======================================================
// GOOGLE OAUTH2 CLIENT
// ======================================================

const oauth2Client = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN
});

// ======================================================
// GMAIL API CLIENT
// ======================================================

const gmail = google.gmail({
  version: 'v1',
  auth: oauth2Client
});

// ======================================================
// CREATE RAW EMAIL
// ======================================================

const createRawEmail = ({
  to,
  from,
  subject,
  html
}) => {
  const email = [
    `From: ${from}`,
    `To: ${to}`,
    'Content-Type: text/html; charset=UTF-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    html
  ].join('\n');

  return Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// ======================================================
// EMAIL TEMPLATE
// ======================================================

const activationTemplate = ({
  firstName,
  activationUrl
}) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Account Activation</title>
      </head>

      <body
        style="
          font-family: Arial, sans-serif;
          background: #f5f5f5;
          padding: 20px;
        "
      >
        <div
          style="
            max-width: 600px;
            margin: auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
          "
        >
          <div
            style="
              background: #2563eb;
              color: white;
              padding: 30px;
              text-align: center;
            "
          >
            <h1>Scientific Journal System</h1>
          </div>

          <div style="padding: 30px">
            <p>
              Hello <strong>${firstName}</strong>,
            </p>

            <p>
              Thank you for registering an account with our system.
            </p>

            <p>
              Please click the button below to activate your account:
            </p>

            <div
              style="
                margin: 30px 0;
                text-align: center;
              "
            >
              <a
                href="${activationUrl}"
                style="
                  background: #2563eb;
                  color: white;
                  text-decoration: none;
                  padding: 14px 28px;
                  border-radius: 8px;
                  display: inline-block;
                  font-weight: bold;
                "
              >
                Activate Account
              </a>
            </div>

            <p>
              If the button above does not work, please copy and paste the following link into your browser:
            </p>

            <p
              style="
                word-break: break-all;
                background: #f3f4f6;
                padding: 12px;
                border-radius: 6px;
              "
            >
              ${activationUrl}
            </p>

            <p>
              This activation link will expire in 24 hours.
            </p>
          </div>

          <div
            style="
              background: #f9fafb;
              padding: 20px;
              text-align: center;
              color: #6b7280;
              font-size: 13px;
            "
          >
            This is an automated email. Please do not reply to this message.
          </div>
        </div>
      </body>
    </html>
    `;

};

// ======================================================
// EMAIL HELPER
// ======================================================

export const emailHelper = {
  sendActivationEmail: async (
    toEmail,
    firstName,
    token
  ) => {
    try {
      const baseUrl =
        process.env.BASE_URL ||
        'http://localhost:8000';

      const activationUrl =
        `${baseUrl}/api/v1/auth/verify?token=${token}`;

      const html = activationTemplate({
        firstName,
        activationUrl
      });

      const raw = createRawEmail({
        to: toEmail,

        from:
          `Scientific Journal System <${process.env.EMAIL_USER}>`,

        subject:
          'Activate Your Scientific Journal System Account',

        html
      });

      const response =
        await gmail.users.messages.send({
          userId: 'me',

          requestBody: {
            raw
          }
        });

      logger.info(
        `[MAIL]: Đã gửi email tới ${toEmail}`
      );

      console.log(response.data);

      return response.data;

    } catch (error) {
      logger.error(
        `[MAIL]: Lỗi gửi activation email tới ${toEmail}`,
        error
      );

      throw new Error(
        'Không thể gửi email kích hoạt tài khoản'
      );
    }
  }
};