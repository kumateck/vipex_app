export function isLocationColumn(id: string, header: unknown) {
  return (
    (!/allocation|locationType/i.test(id) &&
      /location|route|workplace|branch|^(source|destination)$/i.test(id)) ||
    (typeof header === 'string' &&
      /\b(location|route|workplace|branch|source|destination)\b/i.test(header))
  );
}
