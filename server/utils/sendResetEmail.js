// DEV MODE: prints the reset link in the server terminal instead of sending an email.
// When you deploy, replace the body of this one function with a real email provider
// (Resend, Brevo, or nodemailer). Nothing else in the app has to change.
// Never log reset links in production: anyone who can read the logs could take over accounts.
async function sendResetEmail(user, link) {
  console.log('\n=== PASSWORD RESET (dev mode) ===');
  console.log(`To:   ${user.email}`);
  console.log(`Link: ${link}\n`);
}

module.exports = sendResetEmail;