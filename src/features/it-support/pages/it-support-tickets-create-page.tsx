import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateItSupportTicketMutation } from '../api/it-support.api';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const CATEGORIES = ['general', 'hardware', 'software', 'network', 'account', 'printer'] as const;

function prettyValue(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  const kb = sizeBytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

async function toDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed reading file: ${file.name}`));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}

export function ItSupportTicketsCreatePage() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('medium');
  const [category, setCategory] = useState<string>('general');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [createTicket, { isLoading: isCreating }] = useCreateItSupportTicketMutation();

  const canSubmit = Boolean(subject.trim()) && !isCreating;

  const onSelectFiles: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const files = Array.from(event.target.files ?? []);
    setSelectedFiles(files);
  };

  const resetCreateForm = () => {
    setSubject('');
    setDescription('');
    setPriority('medium');
    setCategory('general');
    setSelectedFiles([]);
  };

  const onCreate = async () => {
    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }

    try {
      const attachments = await Promise.all(
        selectedFiles.map(async (file) => ({
          fileName: file.name,
          dataUrl: await toDataUrl(file),
        })),
      );

      await createTicket({
        subject: subject.trim(),
        description: description.trim() || null,
        priority,
        category,
        attachments,
      }).unwrap();

      toast.success('IT support ticket created');
      navigate('/it-support/tickets');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create IT support ticket');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Create IT Support Ticket</CardTitle>
            <Button asChild variant="outline">
              <Link to="/it-support/tickets">Back to tickets</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field className="md:col-span-2">
                <FieldLabel>Subject</FieldLabel>
                <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Priority</FieldLabel>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {prettyValue(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Category</FieldLabel>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {prettyValue(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the issue"
                />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>Attachments</FieldLabel>
                <Input type="file" multiple onChange={onSelectFiles} />
                {selectedFiles.length ? (
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {selectedFiles.map((file) => (
                      <li key={`${file.name}-${file.size}`}>
                        {file.name} ({formatFileSize(file.size)})
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Field>
            </FieldGroup>

            <div className="flex gap-2">
              <Button onClick={onCreate} disabled={!canSubmit}>
                {isCreating ? 'Creating...' : 'Create ticket'}
              </Button>
              <Button variant="outline" onClick={resetCreateForm} disabled={isCreating}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
