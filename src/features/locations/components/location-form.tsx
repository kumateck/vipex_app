import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Spinner } from '@/components/ui';
import type { LocationFormProps } from '../types/location-form.types';
import { useLocationForm } from '../hooks';

export function LocationForm(props: LocationFormProps) {
  const { mode, isSubmitting, title, submitButtonText } = props;
  const {
    control,
    register,
    handleSubmit,
    errors,
    submit,
    branchesData,
    isLoadingBranches,
    onCancel,
  } = useLocationForm(props);
  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(submit)} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  placeholder="Location name"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name?.message ? (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="telephone">Telephone (optional)</FieldLabel>
                <Input
                  id="telephone"
                  type="tel"
                  maxLength={30}
                  placeholder="Location contact number"
                  aria-invalid={!!errors.telephone}
                  aria-describedby="location-telephone-help"
                  {...register('telephone')}
                />
                <p id="location-telephone-help" className="text-sm text-muted-foreground">
                  Used by the SMS locationPhone variable. Leave blank if unavailable.
                </p>
                {errors.telephone?.message ? (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.telephone.message}
                  </p>
                ) : null}
              </Field>
              {mode === 'create' ? (
                <Field>
                  <FieldLabel htmlFor="branchId">Branch</FieldLabel>
                  <Controller
                    control={control}
                    name="branchId"
                    render={({ field }) => (
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="branchId"
                          aria-invalid={!!errors.branchId}
                          disabled={isLoadingBranches}
                        >
                          <SelectValue
                            placeholder={
                              isLoadingBranches ? 'Loading branches...' : 'Select branch'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {(branchesData ?? []).map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.branchId?.message ? (
                    <p className="text-sm text-destructive">{errors.branchId.message}</p>
                  ) : null}
                </Field>
              ) : null}
              {(['canSend', 'canReceive'] as const).map((name) => (
                <Controller
                  key={name}
                  control={control}
                  name={name}
                  render={({ field }) => (
                    <Field orientation="horizontal" className="gap-3">
                      <Checkbox
                        id={name}
                        checked={field.value}
                        onCheckedChange={(value) => field.onChange(value === true)}
                      />
                      <FieldLabel htmlFor={name}>
                        {name === 'canSend' ? 'Sends parcels' : 'Receives parcels'}
                      </FieldLabel>
                    </Field>
                  )}
                />
              ))}
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner /> : null}
                  {isSubmitting
                    ? `${mode === 'create' ? 'Creating...' : 'Saving...'}`
                    : submitButtonText}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
