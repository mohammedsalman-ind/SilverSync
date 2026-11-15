import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((v) => parseInt(v, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  CRON_SECRET: z.string().min(16, {
    message: 'CRON_SECRET must be at least 16 characters for secure constant-time comparison.',
  }),
  // Firebase configuration
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
  FIREBASE_AUTH_EMULATOR_HOST: z.string().optional(),
  FIRESTORE_EMULATOR_HOST: z.string().optional(),
  // AI
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  // Email
  EMAIL_PROVIDER: z.enum(['brevo', 'smtp']).default('brevo'),
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().optional(),
  BREVO_SENDER_NAME: z.string().default('SilverSync Care'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 587)),
  SMTP_SECURE: z.string().optional().transform((v) => v === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().optional(),
  SMTP_FROM_NAME: z.string().default('SilverSync Care'),
  // Google Calendar
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
});

function validateEnv(): z.infer<typeof envSchema> {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues;
    const formattedErrors = issues
      .map((issue) => `❌ [${issue.path.join('.')}]: ${issue.message}`)
      .join('\n');

    process.stderr.write(
      '\n===============================================================================\n' +
        '⚠️ FATAL: Invalid or Missing Server Environment Variables\n' +
        '===============================================================================\n' +
        formattedErrors +
        '\n\nPlease update your server/.env file according to server/.env.example and docs/SETUP_CHECKLIST.md\n' +
        '===============================================================================\n\n'
    );

    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    // Return dummy config for test mode fallback
    return envSchema.parse({
      CRON_SECRET: 'test-cron-secret-16chars-minimum-token',
      NODE_ENV: 'test',
    });
  }

  return result.data;
}

export const env = validateEnv();
