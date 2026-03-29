import { LIST_TAG_ID, OPTIONS_TAG_ID, type ResourceTag, type ServerListResponse } from './types';

export function provideEntityListTags<T extends { id: string }>(
  tag: ResourceTag,
  data?: ServerListResponse<T> | { data: T[] } | null,
) {
  const list = data?.data ?? [];
  if (!list.length) {
    return [{ type: tag, id: LIST_TAG_ID }];
  }

  return [{ type: tag, id: LIST_TAG_ID }, ...list.map((item) => ({ type: tag, id: item.id }))];
}

export function invalidateEntityListTag(tag: ResourceTag) {
  return [{ type: tag }, { type: tag, id: LIST_TAG_ID }, { type: tag, id: OPTIONS_TAG_ID }];
}
