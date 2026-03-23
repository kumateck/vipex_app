import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCreateJobTitleMutation, useListJobTitlesQuery } from '../api/hr.api';

export function JobTitlesPage() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const { data, isLoading } = useListJobTitlesQuery();
  const [createJobTitle, { isLoading: isCreating }] = useCreateJobTitleMutation();

  const rows = data?.data ?? [];

  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Job Titles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Job title code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Input
              placeholder="Job title name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button
              disabled={!name.trim() || isCreating}
              onClick={async () => {
                await createJobTitle({ code: code || null, name: name.trim() }).unwrap();
                setCode('');
                setName('');
              }}
            >
              Add
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3}>Loading job titles...</TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.code ?? '-'}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.isActive ? 'Active' : 'Inactive'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3}>No job titles found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
