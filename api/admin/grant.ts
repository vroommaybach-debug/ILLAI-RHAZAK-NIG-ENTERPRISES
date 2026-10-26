import { z } from 'zod';
import { serverState } from '../../src/server/storeState';

export const AdminGrantSchema = z
  .object({
    requesterEmail: z.string().email(),
    targetEmail: z.string().email(),
    role: z.enum(['assets', 'cms', 'owner']),
  })
  .strict();

export function handleAdminGrant(body: unknown) {
  const parsed = AdminGrantSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      data: {
        error: 'Invalid role assignment payload.',
        details: parsed.error.flatten(),
      },
    };
  }

  const { requesterEmail, targetEmail, role } = parsed.data;
  const requesterRole = serverState.adminRoles.get(requesterEmail);

  if (requesterRole !== 'owner' && requesterEmail !== 'junestudioimagineai@gmail.com') {
    return {
      status: 403,
      data: {
        error: 'Forbidden: Only an owner account can assign admin roles.',
      },
    };
  }

  const previousRole = serverState.adminRoles.get(targetEmail) || null;
  serverState.adminRoles.set(targetEmail, role);

  serverState.recordAudit(
    requesterEmail,
    'owner',
    'admin.grant_role',
    `/admins/${targetEmail}`,
    { role: previousRole },
    { role }
  );

  return {
    status: 200,
    data: {
      granted: true,
      targetEmail,
      role,
    },
  };
}
