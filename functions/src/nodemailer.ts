// @ts-nocheck

require('dotenv').config();
const nodemailer = require('nodemailer');

const pass = process.env.EMAIL_PASS;
const email = process.env.EMAIL;
const adminEmail = process.env.ADMINEMAIL;

let transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: email,
    pass: pass,
  },
});

export function sendApplicantToFaculty(project_title) {
  const mailOptions = {
    from: email,
    to: user.email,
    subject: `Application Recieved for ${project_title}`,
    text: `Hi ${user.name},\n\nWe have receieved a new application for ${posting.project_title}. \n\nBest regards,\nCourse Connect Team`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(
        'Error occurred while sending applicant to faculty email:',
        error
      );
    } else {
      console.log('applicant to faculty sent:', info.response);
    }
  });
}

export function sendStatusUpdateToApplicant(project_title, status) {
  var mailOptions;

  if (status == 'Denied') {
    mailOptions = {
      from: email,
      to: user.email,
      subject: `Application Status Change for ${project_title}`,
      text: `Dear ${user.name},\n\n
Thank you for taking the time to apply for the ${project_title} role. We enjoyed learning about your skills and accomplishments.
After careful consideration, we have decided to move forward with another candidate whose background more closely matches our current needs. We were impressed by your qualifications and will keep your application on file.
In the meantime, we wish you every success in your job search and future endeavors.
Thank you again for your interest. \n\nBest regards,\nCourse Connect Team`,
    };
  } else if (status == 'Approved') {
    mailOptions = {
      from: email,
      to: user.email,
      subject: `Application Status Change for ${project_title}`,
      text: `Dear ${user.name},\n\n Congratulations! We are delighted to let you know that we would like to offer you the position ${project_title}. We believe your experience will make you a great addition to our team. A member in the department will reach out regarding future steps.\n\nBest regards,\nCourse Connect Team`,
    };
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error occurred while sending status update email', error);
    } else {
      console.log('Status update email sent:', info.response);
    }
  });
}

export function sendForgotPasswordEmail(user, resetLink) {
  const mailOptions = {
    from: email,
    to: user.email,
    subject: 'Password Reset for Course Connect',
    text: `Hi ${user.name},\n\nYou recently requested to reset your password. Click the link below to set up a new password:\n${resetLink}\n\nIf you did not make this request, please ignore this email.\n\nBest regards,\nCourse Connect Team`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(
        'Error occurred while sending forgot password email:',
        error
      );
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
    text: `Hi ${user.name},\n\nThank you for submitting your application for the ${position} role in ${classCode}. Your application has been received. We will notify you of the outcome soon.\n\nBest regards,\nCourse Connect Team`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(
        'Error occurred while sending application confirmation email:'
      );
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
    text: `Hi ${user.name},\n\nCongratulations! Your application for the ${position} role in ${classCode} has been approved. To proceed, please provide your UFID to cbobda@ece.ufl.edu. Be sure to include your Position (TA/UPI/Grader), Course Code, Instructor, and UFID in the email. \n\nBest regards,\nCourse Connect Team`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(
        'Error occurred while sending application status (approved) email:',
        error
      );
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
    text: `Hi ${user.name},\n\nWe appreciate your interest in the ${position} role for ${classCode}. After careful consideration, we regret to inform you that your application has not been accepted. Thank you for applying, and we encourage you to try again in the future.\n\nBest regards,\nCourse Connect Team`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(
        'Error occurred while sending application status (denied) email:',
        error
      );
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
    text: `Hi ${user.name},\n\nA student has applied and is awaiting review for the ${position} role in your ${classCode} class. Please review and take appropriate action.\n\nBest regards,\nCourse Connect Team`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(
        'Error occurred while sending faculty notification email:',
        error
      );
    } else {
      console.log('Faculty notification email sent:', info.response);
    }
  });
}
export function sendUnapprovedUserNotificationEmail(user) {
  const mailOptions = {
    from: email,
    to: adminEmail,
    subject: 'New Unapproved User',
    text: `Dear Admin,\n\n${user.name} has recently created an account and is awaiting your approval. Please review the user ${user.email}'s account and approve or deny the registration at your earliest convenience. You can access the user's profile and take action using the following link: https://courseconnect.eng.ufl.edu/.\n\nIf you have any questions or need further assistance, please do not hesitate to contact us.\n\nThank you for your prompt attention to this matter.\n\nBest regards,\nCourse Connect Team`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(
        'Error occurred while sending unapproved user notification email:',
        error
      );
    } else {
      console.log('Unapproved user notification email sent:', info.response);
    }
  });
}
export function sendFacultyAssignedNotificationEmail(
  userEmail,
  position,
  classCode,
  semester
) {
  const mailOptions = {
    from: email,
    to: userEmail,
    subject: 'New Student Application',
    text: `Dear Professor,\n\nA student has been assigned for the ${position} role in your ${semester} ${classCode} class. Please login to your account to view more information regarding the new assignment.\n\nBest regards,\nCourse Connect Team`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(
        'Error occurred while sending faculty notification email:',
        error
      );
    } else {
      console.log('Faculty notification email sent:', info.response);
    }
  });
}

export function sendRenewTAEmail(userEmail, message, subject) {
  const mailOptions = {
    from: email,
    to: userEmail,
    subject: subject,
    text: message,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error occurred while sending TA renewal email:', error);
    } else {
      console.log('TA renewal email sent:', info.response);
    }
  });
}
