import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetCustomerByIdQuery } from '@/features/customers/api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { CustomerUpsertForm } from '../components/customer-upsert-form';

export function CustomerCreateEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useGetCustomerByIdQuery(id ?? '', { skip: !id });

  if (!id) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <CustomerUpsertForm mode="create" />
        </div>
      </ScrollableWrapper>
    );
  }

  if (isLoading || !data) {
    return (
      <ScrollableWrapper>
        <div className="w-full p-4">
          <Card>
            <CardHeader>
              <CardTitle>Loading customer...</CardTitle>
            </CardHeader>
            <CardContent />
          </Card>
        </div>
      </ScrollableWrapper>
    );
  }

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <CustomerUpsertForm mode="edit" customerId={id} initialData={data} />
      </div>
    </ScrollableWrapper>
  );
}
