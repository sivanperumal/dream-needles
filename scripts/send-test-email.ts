/**
 * Sends one test email with the SMTP settings in .env.local, to check that
 * order emails will work (Gmail App Password, Resend, Brevo…).
 *
 * Run: npm run email:test                     (sends to SMTP_USER)
 *      npm run email:test -- you@example.com  (sends to another address)
 */
import { join } from "node:path";
import { config } from "dotenv";
import nodemailer from "nodemailer";

config({ path: join(__dirname, "..", ".env.local"), quiet: true });

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;
const missing = Object.entries({
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
})
  .filter(([, value]) => !value)
  .map(([key]) => key);
if (missing.length) {
  console.error(
    `Missing in .env.local: ${missing.join(", ")}. See SETUP.md Part 2.5.`,
  );
  process.exit(1);
}

const to = process.argv[2] ?? SMTP_USER!;
const port = Number(SMTP_PORT);
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

transporter
  .sendMail({
    from: EMAIL_FROM,
    to,
    subject: "Dream Needles test email",
    text: "Your order emails are set up correctly.",
    html: "<p>Your <strong>Dream Needles</strong> order emails are set up correctly. 🧶</p>",
  })
  .then((info) =>
    console.log(
      `Sent to ${to} via ${SMTP_HOST} (message id ${info.messageId}).`,
    ),
  )
  .catch((error: Error) => {
    console.error(`Could not send: ${error.message}`);
    if (
      /Invalid login|Username and Password not accepted|535/i.test(
        error.message,
      )
    ) {
      console.error(
        "Check SMTP_USER is your full Gmail address and SMTP_PASS is a 16-letter App Password.",
      );
    }
    process.exit(1);
  });
