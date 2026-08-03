import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  let transporter;

  if (process.env.SMTP_USER) {
    // Create a transporter using real SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate test SMTP service account from ethereal.email for local dev
    let testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Using Ethereal Email for testing: ', testAccount.user);
  }

  // Define email options
  const mailOptions = {
    from: `Raj Electronics <${process.env.SMTP_EMAIL || 'noreply@rajelectronics.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Optional HTML template
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);

  if (!process.env.SMTP_USER) {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
};

export default sendEmail;
