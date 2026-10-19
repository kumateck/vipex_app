import type { Location } from './location.types';
import type {
  CreateLocationFormValues,
  EditLocationFormValues,
} from '../schemas/location-form.schema';

interface LocationFormBaseProps {
  initialData?: Partial<Location>;
  isSubmitting: boolean;
  title: string;
  submitButtonText: string;
}

interface CreateLocationFormProps extends LocationFormBaseProps {
  mode: 'create';
  onSubmit: (data: CreateLocationFormValues) => Promise<void>;
}

interface EditLocationFormProps extends LocationFormBaseProps {
  mode: 'edit';
  onSubmit: (data: EditLocationFormValues) => Promise<void>;
}

export type LocationFormProps = CreateLocationFormProps | EditLocationFormProps;
export type LocationFormValues = {
  name: string;
  branchId?: string;
  canSend: boolean;
  canReceive: boolean;
};
