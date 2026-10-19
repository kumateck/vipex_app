export async function resolveCustomerByTelephone(input: {
  findExisting: () => Promise<{ id: string } | null>;
  create: () => Promise<{ id: string }>;
}) {
  const existing = await input.findExisting();
  if (existing) return { id: existing.id };

  try {
    return await input.create();
  } catch (error) {
    const concurrentlyCreated = await input.findExisting();
    if (concurrentlyCreated) return { id: concurrentlyCreated.id };
    throw error;
  }
}
