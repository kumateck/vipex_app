export type DialogResourceState = {
  required: boolean;
  hasData: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
};

type QueryLoadState = {
  data?: unknown;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
};

export function getDialogResourceState(
  query: QueryLoadState,
  required: boolean,
): DialogResourceState {
  return {
    required,
    hasData: query.data !== undefined,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  };
}

export function getDialogLoadState(resources: DialogResourceState[]) {
  const requiredResources = resources.filter((resource) => resource.required);

  return {
    isLoading: requiredResources.some(
      (resource) => resource.isLoading || (resource.isFetching && !resource.hasData),
    ),
    hasError: requiredResources.some((resource) => resource.isError),
  };
}
