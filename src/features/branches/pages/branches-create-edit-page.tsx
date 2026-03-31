import { useParams } from 'react-router-dom';
import { BranchesCreatePage } from './branches-create-page';
import { BranchesEditPage } from './branches-edit-page';

export function BranchesCreateEditPage() {
  const { id } = useParams<{ id: string }>();

  if (id) {
    return <BranchesEditPage />;
  }

  return <BranchesCreatePage />;
}
