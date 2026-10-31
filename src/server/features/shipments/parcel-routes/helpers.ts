export function parseStatuses(value: string | number[] | undefined): number[] | null {
  if (Array.isArray(value)) {
    const parsed = value.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry));
    return parsed.length ? parsed : null;
  }

  if (typeof value === 'string') {
    const parsed = value
      .split(',')
      .map((entry) => Number(entry.trim()))
      .filter((entry) => Number.isFinite(entry));
    return parsed.length ? parsed : null;
  }

  return null;
}

export function emptyParcelList(query: { page?: number; pageSize?: number }) {
  return {
    data: [],
    meta: {
      totalRecords: 0,
      totalPages: 0,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}
