import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { AdminSession, getAdminSession } from './session';
import { revokeAllTrustedDevices } from './trusted-device';

export async function verifyAdminCredentials(email: string, password: string): Promise<AdminSession | null> {
  const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!admin || !admin.isActive) return null;

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return null;

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    isLoggedIn: true,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function setAdminSession(sessionData: AdminSession) {
  const session = await getAdminSession();
  Object.assign(session, sessionData);
  await session.save();
}

export async function destroyAdminSession() {
  const session = await getAdminSession();
  session.destroy();
}

export async function changeAdminPassword(
  adminId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
  if (!admin || !admin.isActive) {
    return { success: false, message: 'غير مصرح' };
  }

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) {
    return { success: false, message: 'كلمة المرور الحالية غير صحيحة.' };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction(async (tx) => {
    await tx.adminUser.update({
      where: { id: adminId },
      data: { passwordHash },
    });
    // Changing the password invalidates every trusted device.
    await revokeAllTrustedDevices(adminId, { db: tx });
    await tx.adminActivity.create({
      data: {
        adminUserId: adminId,
        action: 'تغيير كلمة المرور',
        metadata: JSON.stringify({ source: 'admin_account' }),
      },
    });
  });

  return { success: true, message: 'تم تغيير كلمة المرور بنجاح.' };
}
