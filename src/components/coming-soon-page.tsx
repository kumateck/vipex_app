import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ComingSoonPageProps = {
  title: string;
  description?: string;
};

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="w-full p-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description ?? 'This page is coming soon.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We are still working on this report. Please check back soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
