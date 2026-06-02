import nodemailer from 'nodemailer';
import logger from './logger.js';

// Khởi tạo transporter để gửi email
let transporter = null;

const isSmtpConfigured = () => {
  const { SMTP_USER, SMTP_PASS } = process.env;
  return (
    SMTP_USER &&
    SMTP_PASS &&
    SMTP_USER !== 'your_email@gmail.com' &&
    SMTP_PASS !== 'your_gmail_app_password'
  );
};

if (isSmtpConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465', // true cho port 465, false cho các port khác
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
} else {
  logger.warn(
    '[SMTP]: Chưa cấu hình SMTP đầy đủ trong file .env. Hệ thống sẽ ghi nhận nội dung Email ra Console thay vì gửi thực tế.'
  );
}

export const emailHelper = {
  /**
   * Gửi email kích hoạt tài khoản
   * @param {string} toEmail Email người nhận
   * @param {string} firstName Tên người nhận
   * @param {string} token Token kích hoạt tài khoản
   */
  sendActivationEmail: async (toEmail, firstName, token) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
    const activationUrl = `${baseUrl}/api/v1/auth/verify?token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kích hoạt tài khoản</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f3f4f6;
            color: #1f2937;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid #e5e7eb;
          }
          .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            padding: 40px 20px;
            text-align: center;
            color: #ffffff;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .content {
            padding: 30px 40px;
            line-height: 1.6;
          }
          .content p {
            margin-bottom: 24px;
            font-size: 16px;
          }
          .btn-wrapper {
            text-align: center;
            margin: 35px 0;
          }
          .btn {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff !important;
            padding: 14px 32px;
            text-decoration: none;
            font-weight: 600;
            border-radius: 8px;
            font-size: 16px;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1);
            transition: background-color 0.2s;
          }
          .btn:hover {
            background-color: #1d4ed8;
          }
          .footer {
            background-color: #f9fafb;
            padding: 20px 40px;
            text-align: center;
            font-size: 13px;
            color: #6b7280;
            border-top: 1px solid #f3f4f6;
          }
          .footer a {
            color: #2563eb;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Chào mừng đến với Scientific Journal System</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${firstName}</strong>,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại hệ thống của chúng tôi. Để hoàn tất thủ tục đăng ký và bắt đầu sử dụng dịch vụ, vui lòng xác thực email bằng cách click vào nút dưới đây:</p>
            <div class="btn-wrapper">
              <a href="${activationUrl}" class="btn" target="_blank">Kích hoạt tài khoản</a>
            </div>
            <p>Nếu nút kích hoạt trên không hoạt động, bạn có thể sao chép liên kết dưới đây và dán vào trình duyệt:</p>
            <p style="word-break: break-all; font-size: 14px; color: #4b5563; background-color: #f3f4f6; padding: 12px; border-radius: 6px;">
              ${activationUrl}
            </p>
            <p>Liên kết này có hiệu lực trong vòng <strong>24 giờ</strong>.</p>
          </div>
          <div class="footer">
            <p>Đây là email tự động từ hệ thống. Vui lòng không phản hồi email này.</p>
            <p>&copy; 2026 Scientific Journal System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Scientific Journal System" <your_email@gmail.com>',
      to: toEmail,
      subject: 'Kích hoạt tài khoản Scientific Journal System',
      html: htmlContent
    };

    if (transporter) {
      try {
        await transporter.sendMail(mailOptions);
        logger.info(`[SMTP]: Đã gửi email kích hoạt tới ${toEmail} thành công.`);
      } catch (err) {
        logger.error(`[SMTP]: Lỗi khi gửi email tới ${toEmail}:`, err);
        throw new Error('Không thể gửi email kích hoạt tài khoản');
      }
    } else {
      // MOCK mode: ghi nhận ra log
      logger.info('================= [SMTP MOCK EMAIL] =================');
      logger.info(`To: ${toEmail}`);
      logger.info(`Subject: ${mailOptions.subject}`);
      logger.info(`Activation URL: ${activationUrl}`);
      logger.info('=====================================================');
    }
  },

  /**
   * Gửi email đặt lại mật khẩu
   * @param {string} toEmail Email người nhận
   * @param {string} firstName Tên người nhận
   * @param {string} token Token đặt lại mật khẩu (dạng plain text)
   */
  sendResetPasswordEmail: async (toEmail, firstName, token) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đặt lại mật khẩu</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f3f4f6;
            color: #1f2937;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid #e5e7eb;
          }
          .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            padding: 40px 20px;
            text-align: center;
            color: #ffffff;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .content {
            padding: 30px 40px;
            line-height: 1.6;
          }
          .content p {
            margin-bottom: 24px;
            font-size: 16px;
          }
          .btn-wrapper {
            text-align: center;
            margin: 35px 0;
          }
          .btn {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff !important;
            padding: 14px 32px;
            text-decoration: none;
            font-weight: 600;
            border-radius: 8px;
            font-size: 16px;
            box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2), 0 2px 4px -1px rgba(239, 68, 68, 0.1);
            transition: background-color 0.2s;
          }
          .btn:hover {
            background-color: #1d4ed8;
          }
          .footer {
            background-color: #f9fafb;
            padding: 20px 40px;
            text-align: center;
            font-size: 13px;
            color: #6b7280;
            border-top: 1px solid #f3f4f6;
          }
          .footer a {
            color: #2563eb;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Đặt lại mật khẩu tài khoản</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${firstName}</strong>,</p>
            <p>Bạn nhận được email này vì đã gửi yêu cầu đặt lại mật khẩu cho tài khoản của mình tại Scientific Journal System.</p>
            <p>Vui lòng click vào nút dưới đây để tiến hành đặt lại mật khẩu mới:</p>
            <div class="btn-wrapper">
              <a href="${resetUrl}" class="btn" target="_blank">Đặt lại mật khẩu</a>
            </div>
            <p>Nếu nút đặt lại mật khẩu trên không hoạt động, bạn có thể sao chép liên kết dưới đây và dán vào trình duyệt:</p>
            <p style="word-break: break-all; font-size: 14px; color: #4b5563; background-color: #f3f4f6; padding: 12px; border-radius: 6px;">
              ${resetUrl}
            </p>
            <p>Liên kết này có hiệu lực trong vòng <strong>15 phút</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email này.</p>
          </div>
          <div class="footer">
            <p>Đây là email tự động từ hệ thống. Vui lòng không phản hồi email này.</p>
            <p>&copy; 2026 Scientific Journal System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Scientific Journal System" <your_email@gmail.com>',
      to: toEmail,
      subject: 'Đặt lại mật khẩu tài khoản Scientific Journal System',
      html: htmlContent
    };

    if (transporter) {
      try {
        await transporter.sendMail(mailOptions);
        logger.info(`[SMTP]: Đã gửi email đặt lại mật khẩu tới ${toEmail} thành công.`);
      } catch (err) {
        logger.error(`[SMTP]: Lỗi khi gửi email tới ${toEmail}:`, err);
        throw new Error('Không thể gửi email đặt lại mật khẩu');
      }
    } else {
      // MOCK mode: ghi nhận ra log
      logger.info('================= [SMTP MOCK EMAIL] =================');
      logger.info(`To: ${toEmail}`);
      logger.info(`Subject: ${mailOptions.subject}`);
      logger.info(`Reset URL: ${resetUrl}`);
      logger.info('=====================================================');
    }
  }
};
