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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  useGetCurrentUserProfileQuery,
  useUpdateCurrentUserProfileMutation,
} from '@/features/auth/api';
import { useAuthStore } from '@/stores/auth-store';
import ThrowErrorMessage from '@/lib/throw-error';

export function ProfilePage() {
  const authUser = useAuthStore((state) => state.user);
  const { data, isLoading, isFetching } = useGetCurrentUserProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateCurrentUserProfileMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [fullname, setFullname] = useState('');
  const [telephone, setTelephone] = useState('');

  useEffect(() => {
    if (!data) return;
    setFullname(data.fullname ?? '');
    setTelephone(data.telephone ?? '');
  }, [data]);

  const canSave =
    isEditing &&
    !isUpdating &&
    !!fullname.trim() &&
    !!telephone.trim() &&
    !!data &&
    (fullname.trim() !== data.fullname || telephone.trim() !== data.telephone);

  async function onSave() {
    if (!canSave) return;
    try {
      await updateProfile({ fullname: fullname.trim(), telephone: telephone.trim() }).unwrap();
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

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="profile-fullname">Full name</FieldLabel>
              <Input
                id="profile-fullname"
                value={fullname}
                onChange={(event) => setFullname(event.target.value)}
                disabled={!isEditing || isUpdating}
                placeholder="Full name"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="profile-email">Email</FieldLabel>
              <Input
                id="profile-email"
                value={data?.email ?? authUser?.email ?? ''}
                disabled
                placeholder="Email"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="profile-telephone">Telephone</FieldLabel>
              <Input
                id="profile-telephone"
                value={telephone}
                onChange={(event) => setTelephone(event.target.value)}
                disabled={!isEditing || isUpdating}
                placeholder="Telephone"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="profile-role">Role</FieldLabel>
              <Input
                id="profile-role"
                value={data?.role?.name ?? authUser?.role?.name ?? '-'}
                disabled
                placeholder="Role"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="profile-branch">Branch</FieldLabel>
              <Input
                id="profile-branch"
                value={data?.branch?.name ?? authUser?.branch?.name ?? '-'}
                disabled
                placeholder="Branch"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="profile-location">Location</FieldLabel>
              <Input
                id="profile-location"
                value={
                  data?.location?.name ??
                  data?.locationName ??
                  authUser?.location?.name ??
                  authUser?.locationName ??
                  'Not assigned'
                }
                disabled
                placeholder="Location"
              />
            </Field>
          </FieldGroup>
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
