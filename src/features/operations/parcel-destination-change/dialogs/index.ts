import { lazy } from 'react';

export const ChangeDestinationDialog = lazy(() =>
  import('./change-destination-dialog').then((module) => ({
    default: module.ChangeDestinationDialog,
  })),
);
