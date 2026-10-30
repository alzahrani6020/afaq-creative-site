import 'dotenv/config';
import readline from 'readline';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function askPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl: any = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.stdoutMuted = true;

    rl.question(question, (password: string) => {
      rl.close();
      process.stdout.write('\n');
      resolve(password);
    });

    rl._writeToOutput = function _writeToOutput(stringToWrite: string) {
      if (rl.stdoutMuted) {
        if (stringToWrite.trim() === '') return;
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(question + '*'.repeat(rl.line?.length || 0));
      } else {
        process.stdout.write(stringToWrite);
      }
    };
  });
}

async function main() {
  const [argEmail, argPassword] = process.argv.slice(2);

  let email: string;
  let password: string;
  let confirm: string;

  if (argEmail && argPassword) {
    email = argEmail;
    password = argPassword;
    confirm = argPassword;
    console.log('إعادة تعيين كلمة المرور من سطر الأوامر\n');
  } else {
    console.log('إعادة تعيين كلمة مرور حساب إداري\n');
    email = await ask('البريد الإلكتروني للحساب: ');
    password = await askPassword('كلمة المرور الجديدة: ');
    confirm = await askPassword('تأكيد كلمة المرور الجديدة: ');
  }

  if (!email || !password) {
    console.error('جميع الحقول مطلوبة.');
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    console.error('البريد الإلكتروني غير صحيح.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('يجب أن تكون كلمة المرور 8 أحرف على الأقل.');
    process.exit(1);
  }

  if (password !== confirm) {
    console.error('كلمتا المرور غير متطابقتين.');
    process.exit(1);
  }

  const existing = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
  if (!existing) {
    console.error('لا يوجد حساب إداري مرتبط بهذا البريد الإلكتروني.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.update({
    where: { email: normalizedEmail },
    data: { passwordHash },
  });

  console.log('\nتمت إعادة تعيين كلمة المرور بنجاح.');
  console.log('البريد:', normalizedEmail);
}

main()
  .catch((err) => {
    console.error('حدث خطأ:', err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
