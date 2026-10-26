import crypto from 'node:crypto';
import { z } from 'zod';
import { serverState } from '../../src/server/storeState';

export const AdminPasscodeSchema = z
  .object({
    passcode: z.string().min(4).max(64),
    email: z.string().email().optional(),
  })
  .strict();

const DEFAULT_SALT = process.env.ADMIN_PASSCODE_SALT || 'ir-ikeja-lagos-salt-v1';
// Default passcode for store owner/testing is "IR-IKEJA-2026" unless overridden via ADMIN_PASSCODE_HASH
const DEFAULT_PASSCODE_HASH = crypto
  .scryptSync('IR-IKEJA-2026', DEFAULT_SALT, 32)
  .toString('hex');

export function verifyPasscodeConstantTime(inputPasscode: string): boolean {
  const targetHex = process.env.ADMIN_PASSCODE_HASH || DEFAULT_PASSCODE_HASH;
  const candidateHex = crypto
    .scryptSync(inputPasscode.trim(), DEFAULT_SALT, 32)
    .toString('hex');

  if (targetHex.length !== candidateHex.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(targetHex), Buffer.from(candidateHex));
}

export function handleAdminPasscode(body: unknown) {
  const parsed = AdminPasscodeSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      data: {
        error: 'Invalid passcode request payload.',
        details: parsed.error.flatten(),
      },
    };
  }

  const isValid = verifyPasscodeConstantTime(parsed.data.passcode);
  if (!isValid) {
    return {
      status: 401,
      data: {
        verified: false,
        error: 'Incorrect second-factor admin passcode.',
      },
    };
  }

  const email = parsed.data.email || 'junestudioimagineai@gmail.com';
  const role = serverState.adminRoles.get(email) || 'owner';

  serverState.recordAudit(
    email,
    role,
    'admin.passcode_verified',
    '/admin',
    { verified: false },
    { verified: true }
  );

  return {
    status: 200,
    data: {
      verified: true,
      role,
      sessionToken: crypto.randomBytes(16).toString('hex'),
    },
  };
}
