import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";

const sendGridkey = process.env.SENDGRID_API_KEY || "";
sgMail.setApiKey(sendGridkey);

// Set up nodemailer transporter using SMTP transport
const config = {
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  from: process.env.EMAIL_USERNAME,
};

const transporter = nodemailer.createTransport(config);

// Function to send password reset OTP email
export async function sendEmail(
  recipientEmail: string,
  subject: string,
  body: string
) {
  try {
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `Fireworks team ${process.env.EMAIL_USERNAME}`, // sender address
      to: recipientEmail, // list of receivers
      subject: subject, // Subject line
      html: body, // HTML body
    });

    console.log(`Message sent to ${recipientEmail}: ${info.messageId}`);
  } catch (error) {
    console.error(
      `Error sending reset password OTP email to ${recipientEmail}:`,
      error
    );
  }
}

// export const sendOtpEmail = async (user: IUser, otp: string) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: process.env.EMAIL_SERVICE,
//       auth: {
//         user: process.env.EMAIL_USERNAME,
//         pass: process.env.EMAIL_PASSWORD,
//       },
//     });

//     const mailOptions = {
//       from: process.env.EMAIL_FROM_ADDRESS,
//       to: user.email,
//       subject: "Your OTP for password reset",
//       html: `
//         <p>Dear ${user.name},</p>
//         <p>Your OTP for password reset is: <strong>${otp}</strong></p>
//         <p>This OTP will expire in 1 hour.</p>
//         <p>Best regards,</p>
//         <p>The Password Reset Team</p>
//       `,
//     };

//     await transporter.sendMail(mailOptions);
//     console.log(`OTP email sent to ${user.email}`);
//   } catch (error) {
//     console.error(`Error sending OTP email to ${user.email}:`, error);
//   }
// };
