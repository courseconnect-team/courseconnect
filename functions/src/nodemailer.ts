// @ts-nocheck

require('dotenv').config()
const nodemailer = require('nodemailer');

const pass =  process.env.EMAIL_PASS
const email = process.env.EMAIL

let transporter = nodemailer.createTransport({
  
      host: "smtp.gmail.com",
       port: 465,
       secure: true,
       auth: { 
          user: email,
          pass: pass,
             },
      });

export function sendForgotPasswordEmail(user, resetLink) {
    const mailOptions = {
      from: email,
      to: user.email,
      subject: 'Password Reset for Course Connect',
      text: `Hi ${user.name},\n\nYou recently requested to reset your password. Click the link below to set up a new password:\n${resetLink}\n\nIf you did not make this request, please ignore this email.\n\nBest regards,\nCourse Connect Team`
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error occurred while sending forgot password email:', error);
      } else {
        console.log('Forgot password email sent:', info.response);
      }
    });
  }
  
 export function sendApplicationConfirmationEmail(user, position, classCode) {
    const mailOptions = {
      from: email,
      to: user.email,
      subject: 'Application Submitted Confirmation',
      text: `Hi ${user.name},\n\nThank you for submitting your application for the ${position} role in ${classCode}. Your application has been received. We will notify you of the outcome soon.\n\nBest regards,\nCourse Connect Team`
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(pass)
        console.error("play")
        console.error('Error occurred while sending application confirmation email:', pass);
      } else {
        console.log('Application confirmation email sent:', info.response);
      }
    });
  }

  export function sendApplicationStatusApprovedEmail(user, position, classCode) {
    const mailOptions = {
      from: email,
      to: user.email,
      subject: 'Student Application Status',
      text: `Hi ${user.name},\n\nCongratulations! Your application for the ${position} role in ${classCode} has been approved. To proceed, please provide your UFID as soon as possible.\n\nBest regards,\nCourse Connect Team`
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error occurred while sending application status (approved) email:', error);
      } else {
        console.log('Application status (approved) email sent:', info.response);
      }
    });
  }
  
  // Function to send Student Application Status (Denied) email
 export function sendApplicationStatusDeniedEmail(user, position, classCode) {
    const mailOptions = {
      from: email,
      to: user.email,
      subject: 'Student Application Status',
      text: `Hi ${user.name},\n\nWe appreciate your interest in the ${position} role for ${classCode}. After careful consideration, we regret to inform you that your application has not been accepted. Thank you for applying, and we encourage you to try again in the future.\n\nBest regards,\nCourse Connect Team`
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error occurred while sending application status (denied) email:', error);
      } else {
        console.log('Application status (denied) email sent:', info.response);
      }
    });
  }
  
  // Function to send Faculty Notification email
 export function sendFacultyNotificationEmail(user, position, classCode) {
    const mailOptions = {
      from: email,
      to: user.email,
      subject: 'New Student Application',
      text: `Hi ${user.name},\n\nA student has applied and is awaiting review for the ${position} role in your ${classCode} class. Please review and take appropriate action.\n\nBest regards,\nCourse Connect Team`
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error occurred while sending faculty notification email:', error);
      } else {
        console.log('Faculty notification email sent:', info.response);
      }
    });
  }
  