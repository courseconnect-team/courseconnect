import nodemailer from 'nodemailer';

type EmailUser = {
  name?: string;
  email: string;
};

const email = process.env.EMAIL ?? '';
const pass = process.env.EMAIL_PASS ?? '';
const adminEmail = process.env.ADMINEMAIL ?? '';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: email,
    pass,
  },
});

function assertTransportConfigured() {
  if (!email || !pass) {
    throw new Error('EMAIL and EMAIL_PASS must be configured');
  }
}

function displayName(user: EmailUser): string {
  return user.name?.trim() || 'there';
}

async function sendMail(
  options: nodemailer.SendMailOptions,
  successMessage: string
): Promise<void> {
  assertTransportConfigured();
  const info = await transporter.sendMail(options);
  console.log(successMessage, info.response);
}

export async function sendApplicantToFaculty(
  user: EmailUser,
  projectTitle: string
): Promise<void> {
  await sendMail(
    {
      from: email,
      to: user.email,
      subject: `Application Received for ${projectTitle}`,
      text: `Hi ${displayName(
        user
      )},\n\nWe have received a new application for ${projectTitle}.\n\nBest regards,\nCourse Connect Team`,
    },
    'Applicant-to-faculty email sent:'
  );
}

export async function sendStatusUpdateToApplicant(
  user: EmailUser,
  projectTitle: string,
  status: string
): Promise<void> {
  const denied = status.toLowerCase() === 'denied';
  const approved = status.toLowerCase() === 'approved';

  if (!denied && !approved) {
    throw new Error(`Unsupported status for update email: ${status}`);
  }

  const text = denied
    ? `Dear ${displayName(
        user
      )},\n\nThank you for taking the time to apply for the ${projectTitle} role. After careful consideration, we have decided to move forward with another candidate. We appreciate your interest and wish you success in your future endeavors.\n\nBest regards,\nCourse Connect Team`
    : `Dear ${displayName(
        user
      )},\n\nCongratulations! We are delighted to offer you the ${projectTitle} position. A member of the department will reach out with next steps.\n\nBest regards,\nCourse Connect Team`;

  await sendMail(
    {
      from: email,
      to: user.email,
      subject: `Application Status Change for ${projectTitle}`,
      text,
    },
    'Status update email sent:'
  );
}

export async function sendForgotPasswordEmail(
  user: EmailUser,
  resetLink: string
): Promise<void> {
  await sendMail(
    {
      from: email,
      to: user.email,
      subject: 'Password Reset for Course Connect',
      text: `Hi ${displayName(
        user
      )},\n\nYou recently requested to reset your password. Click the link below to set up a new password:\n${resetLink}\n\nIf you did not make this request, please ignore this email.\n\nBest regards,\nCourse Connect Team`,
    },
    'Forgot password email sent:'
  );
}

export async function sendApplicationConfirmationEmail(
  user: EmailUser,
  position: string,
  classCode: string
): Promise<void> {
  await sendMail(
    {
      from: email,
      to: user.email,
      subject: 'Application Submitted Confirmation',
      text: `Hi ${displayName(
        user
      )},\n\nThank you for submitting your application for the ${position} role in ${classCode}. Your application has been received. We will notify you of the outcome soon.\n\nBest regards,\nCourse Connect Team`,
    },
    'Application confirmation email sent:'
  );
}

export async function sendApplicationStatusApprovedEmail(
  user: EmailUser,
  position: string,
  classCode: string
): Promise<void> {
  await sendMail(
    {
      from: email,
      to: user.email,
      subject: 'Student Application Status',
      text: `Hi ${displayName(
        user
      )},\n\nCongratulations! Your application for the ${position} role in ${classCode} has been approved. To proceed, please provide your UFID to cbobda@ece.ufl.edu. Include your position, course code, instructor, and UFID.\n\nBest regards,\nCourse Connect Team`,
    },
    'Application status approved email sent:'
  );
}

export async function sendApplicationStatusDeniedEmail(
  user: EmailUser,
  position: string,
  classCode: string
): Promise<void> {
  await sendMail(
    {
      from: email,
      to: user.email,
      subject: 'Student Application Status',
      text: `Hi ${displayName(
        user
      )},\n\nWe appreciate your interest in the ${position} role for ${classCode}. After careful consideration, we regret to inform you that your application has not been accepted. Thank you for applying.\n\nBest regards,\nCourse Connect Team`,
    },
    'Application status denied email sent:'
  );
}

export async function sendFacultyNotificationEmail(
  user: EmailUser,
  position: string,
  classCode: string
): Promise<void> {
  await sendMail(
    {
      from: email,
      to: user.email,
      subject: 'New Student Application',
      text: `Hi ${displayName(
        user
      )},\n\nA student has applied for the ${position} role in your ${classCode} class and is awaiting review.\n\nBest regards,\nCourse Connect Team`,
    },
    'Faculty notification email sent:'
  );
}

export async function sendUnapprovedUserNotificationEmail(
  user: EmailUser
): Promise<void> {
  if (!adminEmail) {
    throw new Error('ADMINEMAIL must be configured');
  }

  await sendMail(
    {
      from: email,
      to: adminEmail,
      subject: 'New Unapproved User',
      text: `Dear Admin,\n\n${displayName(
        user
      )} has recently created an account and is awaiting your approval. Please review ${user.email}'s account and approve or deny registration at your earliest convenience.\n\nBest regards,\nCourse Connect Team`,
    },
    'Unapproved user notification email sent:'
  );
}

export async function sendFacultyAssignedNotificationEmail(
  userEmail: string,
  position: string,
  classCode: string,
  semester: string
): Promise<void> {
  await sendMail(
    {
      from: email,
      to: userEmail,
      subject: 'New Student Application',
      text: `Dear Professor,\n\nA student has been assigned for the ${position} role in your ${semester} ${classCode} class. Please sign in to view details.\n\nBest regards,\nCourse Connect Team`,
    },
    'Faculty assigned notification email sent:'
  );
}

export async function sendRenewTAEmail(
  userEmail: string,
  message: string,
  subject: string
): Promise<void> {
  await sendMail(
    {
      from: email,
      to: userEmail,
      subject,
      text: message,
    },
    'TA renewal email sent:'
  );
}
