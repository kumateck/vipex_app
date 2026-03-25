import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerUpsertForm } from '@/features/customers/components/customer-upsert-form';
import { useGetCustomerByIdQuery } from '@/features/customers/api';

export default function CustomerEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useGetCustomerByIdQuery(id ?? '', { skip: !id });

  if (!id) {
    return (
      <div className="w-full p-4">
        <Card>
          <CardHeader>
            <CardTitle>Invalid customer id</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="w-full p-4">
        <Card>
          <CardHeader>
            <CardTitle>Loading customer...</CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    );
  }

  return <CustomerUpsertForm mode="edit" customerId={id} initialData={data} />;
}
