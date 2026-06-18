'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button, Spinner } from '@/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  useGetCurrentUserProfileQuery,
  useUpdateCurrentUserProfileMutation,
} from '@/features/auth/api';
import { isTenDigitPhone, normalizePhoneDigits, phoneLengthMessage } from '@/lib/phone';
import ThrowErrorMessage from '@/lib/throw-error';
import { useAuthStore } from '@/stores/auth-store';
import { useSecurityPreferencesStore } from '@/stores/security-preferences-store';
import { ProfileFormFields } from './profile-form-fields';

export function ProfilePage() {
  const authUser = useAuthStore((state) => state.user);
  const { data, isLoading, isFetching } = useGetCurrentUserProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateCurrentUserProfileMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [fullname, setFullname] = useState('');
  const [telephone, setTelephone] = useState('');

  const setScreenTimeoutMinutes = useSecurityPreferencesStore(
    (state) => state.setScreenTimeoutMinutes,
  );
  const getScreenTimeoutMinutes = useSecurityPreferencesStore(
    (state) => state.getScreenTimeoutMinutes,
  );

  const timeoutMinutes = authUser ? getScreenTimeoutMinutes(authUser.id) : 0;

  useEffect(() => {
    if (!data) return;
    setFullname(data.fullname ?? '');
    setTelephone(data.telephone ?? '');
  }, [data]);

  const canSave =
    isEditing &&
    !isUpdating &&
    !!fullname.trim() &&
    isTenDigitPhone(telephone) &&
    !!data &&
    (fullname.trim() !== data.fullname || telephone.trim() !== data.telephone);

  async function onSave() {
    if (!canSave) return;
    const phone = normalizePhoneDigits(telephone);
    if (!isTenDigitPhone(phone)) {
      toast.error(phoneLengthMessage());
      return;
    }

    try {
      await updateProfile({ fullname: fullname.trim(), telephone: phone }).unwrap();
      toast.success('Profile updated');
      setIsEditing(false);
    } catch (error) {
      ThrowErrorMessage(error);
    }
  }

  function onCancel() {
    setIsEditing(false);
    setFullname(data?.fullname ?? '');
    setTelephone(data?.telephone ?? '');
  }

  const onTimeoutChange = (value: string) => {
    if (!authUser) return;
    const minutes = Number.parseInt(value, 10);
    if (Number.isNaN(minutes)) return;
    setScreenTimeoutMinutes(authUser.id, minutes);
    toast.success('Screen timeout updated');
  };

  const email = data?.email ?? authUser?.email ?? '';
  const roleName = data?.role?.name ?? authUser?.role?.name ?? '-';
  const branchName = data?.branch?.name ?? authUser?.branch?.name ?? '-';
  const locationName =
    data?.location?.name ??
    data?.locationName ??
    authUser?.location?.name ??
    authUser?.locationName ??
    'Not assigned';

  return (
    <div className="mx-auto w-full max-w-2xl p-4 py-1">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>View and update your personal profile information.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading || isFetching ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              <span>Loading profile...</span>
            </div>
          ) : null}

          <ProfileFormFields
            fullname={fullname}
            onFullnameChange={setFullname}
            telephone={telephone}
            onTelephoneChange={setTelephone}
            isEditing={isEditing}
            isUpdating={isUpdating}
            email={email}
            roleName={roleName}
            branchName={branchName}
            locationName={locationName}
            timeoutMinutes={timeoutMinutes}
            onTimeoutChange={onTimeoutChange}
            canChangeTimeout={!!authUser}
          />
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-2">
          {isEditing ? (
            <>
              <Button type="button" variant="outline" onClick={onCancel} disabled={isUpdating}>
                Cancel
              </Button>
              <Button type="button" onClick={onSave} disabled={!canSave}>
                {isUpdating ? <Spinner /> : null}
                {isUpdating ? 'Saving...' : 'Save changes'}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={() => setIsEditing(true)}
              disabled={isLoading || isFetching}
            >
              Edit profile
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
