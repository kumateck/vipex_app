'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { CreatableCombobox } from './creatable-combobox';

type CityOption = {
  id: string;
  name: string;
};

const syncSeedCities: CityOption[] = [
  { id: 'accra', name: 'Accra' },
  { id: 'lagos', name: 'Lagos' },
  { id: 'nairobi', name: 'Nairobi' },
];

const asyncSeedCities: CityOption[] = [
  { id: 'new-york', name: 'New York' },
  { id: 'newark', name: 'Newark' },
  { id: 'new-orleans', name: 'New Orleans' },
];

export function SyncCreatableComboboxExample() {
  const [value, setValue] = React.useState<string>();
  const [cities, setCities] = React.useState<CityOption[]>(syncSeedCities);

  return (
    <CreatableCombobox<CityOption>
      value={value}
      options={cities}
      getLabel={(item) => item.name}
      getValue={(item) => item.id}
      onChange={(nextValue) => setValue(nextValue)}
      onCreate={async (input) => {
        const newCity = {
          id: input.trim().toLowerCase().replace(/\s+/g, '-'),
          name: input.trim(),
        };

        setCities((prev) => [...prev, newCity]);
        return newCity;
      }}
      placeholder="Select city"
    />
  );
}

export function SyncSelectOnlyComboboxExample() {
  const [value, setValue] = React.useState<string>();

  return (
    <CreatableCombobox<CityOption>
      value={value}
      options={syncSeedCities}
      getLabel={(item) => item.name}
      getValue={(item) => item.id}
      onChange={(nextValue) => setValue(nextValue)}
      allowCreate={false}
      placeholder="Select city"
    />
  );
}

export function AsyncCreatableComboboxExample() {
  const [value, setValue] = React.useState<string>();

  const fetchOptions = React.useCallback(async (query: string) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return asyncSeedCities;
    }

    return asyncSeedCities.filter((item) => item.name.toLowerCase().includes(normalized));
  }, []);

  return (
    <CreatableCombobox<CityOption>
      value={value}
      fetchOptions={fetchOptions}
      getLabel={(item) => item.name}
      getValue={(item) => item.id}
      onChange={(nextValue) => setValue(nextValue)}
      onCreate={async (input) => {
        const newCity = {
          id: input.trim().toLowerCase().replace(/\s+/g, '-'),
          name: input.trim(),
        };

        return newCity;
      }}
      placeholder="Search cities"
    />
  );
}

type ExampleFormValues = {
  city: string;
};

export function ReactHookFormCreatableComboboxExample() {
  const form = useForm<ExampleFormValues>({
    defaultValues: {
      city: '',
    },
  });

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(() => undefined)}>
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <CreatableCombobox<CityOption>
                  value={field.value}
                  onChange={(nextValue) => field.onChange(nextValue)}
                  options={syncSeedCities}
                  getLabel={(item) => item.name}
                  getValue={(item) => item.id}
                  onCreate={async (input) => ({
                    id: input.trim().toLowerCase().replace(/\s+/g, '-'),
                    name: input.trim(),
                  })}
                  placeholder="Select or create city"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

/**
 * RTK Query integration shape:
 *
 * const [trigger] = useLazySearchCitiesQuery();
 * <CreatableCombobox
 *   fetchOptions={async (q) => {
 *     const result = await trigger(q).unwrap();
 *     return result.items;
 *   }}
 * />
 */
