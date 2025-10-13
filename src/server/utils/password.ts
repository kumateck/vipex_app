export async function hashPassword(plain: string) {
  return await Bun.password.hash(plain, {
    algorithm: 'bcrypt',
    cost: Number(process.env.PASSWORD_COST || 10),
  });
}

export async function verifyPassword(plain: string, hash: string | null) {
  if (!hash) return false;
  return await Bun.password.verify(plain, hash);
}
