import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SCREEN_TIMEOUT_OPTIONS_MINUTES,
  formatScreenTimeoutLabel,
} from '@/features/auth/constants';

type ProfileFormFieldsProps = {
  fullname: string;
  onFullnameChange: (value: string) => void;
  telephone: string;
  onTelephoneChange: (value: string) => void;
  isEditing: boolean;
  isUpdating: boolean;
  email: string;
  roleName: string;
  branchName: string;
  locationName: string;
  timeoutMinutes: number;
  onTimeoutChange: (value: string) => void;
  canChangeTimeout: boolean;
};

export function ProfileFormFields({
  fullname,
  onFullnameChange,
  telephone,
  onTelephoneChange,
  isEditing,
  isUpdating,
  email,
  roleName,
  branchName,
  locationName,
  timeoutMinutes,
  onTimeoutChange,
  canChangeTimeout,
}: ProfileFormFieldsProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="profile-fullname">Full name</FieldLabel>
        <Input
          id="profile-fullname"
          value={fullname}
          onChange={(event) => onFullnameChange(event.target.value)}
          disabled={!isEditing || isUpdating}
          placeholder="Full name"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="profile-email">Email</FieldLabel>
        <Input id="profile-email" value={email} disabled placeholder="Email" />
      </Field>

      <Field>
        <FieldLabel htmlFor="profile-telephone">Telephone</FieldLabel>
        <Input
          id="profile-telephone"
          value={telephone}
          onChange={(event) => onTelephoneChange(event.target.value)}
          disabled={!isEditing || isUpdating}
          placeholder="Telephone"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="profile-role">Role</FieldLabel>
        <Input id="profile-role" value={roleName} disabled placeholder="Role" />
      </Field>

      <Field>
        <FieldLabel htmlFor="profile-branch">Branch</FieldLabel>
        <Input id="profile-branch" value={branchName} disabled placeholder="Branch" />
      </Field>

      <Field>
        <FieldLabel htmlFor="profile-location">Location</FieldLabel>
        <Input id="profile-location" value={locationName} disabled placeholder="Location" />
      </Field>

      <Field>
        <FieldLabel htmlFor="profile-screen-timeout">Screen timeout</FieldLabel>
        <Select
          value={String(timeoutMinutes)}
          onValueChange={onTimeoutChange}
          disabled={!canChangeTimeout}
        >
          <SelectTrigger id="profile-screen-timeout">
            <SelectValue placeholder="Select timeout" />
          </SelectTrigger>
          <SelectContent>
            {SCREEN_TIMEOUT_OPTIONS_MINUTES.map((minutes) => (
              <SelectItem key={minutes} value={String(minutes)}>
                {formatScreenTimeoutLabel(minutes)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  );
}
