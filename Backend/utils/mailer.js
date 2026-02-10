import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendResetEmail = async (email, token) => {
  const resetLink = `${process.env.FRONTEND_URL}/views/reset-password.html?token=${token}`;
  
  const mailOptions = {
    // Correct format: "Display Name" <email@gmail.com>
    from: `"UniStress Support" <${process.env.EMAIL_USER}>`, 
    to: email,
    subject: "UniStress | Password Reset Request", // Updated Title
    html: `
      <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #4e54c8;">UniStress</h2>
        <p>You requested a password reset for your account.</p>
        <p>Click the button below to set a new password. This link expires in 10 minutes.</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #4e54c8; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
        <p style="margin-top: 20px; font-size: 0.85rem; color: #6b7280;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};