import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';

export function SmsDefinitionCell({
  name,
  code,
  detail,
}: {
  name: string;
  code: string;
  detail: string;
}) {
  return (
    <TableCell className="align-top whitespace-normal">
      <p className="truncate font-medium" title={name}>
        {name}
      </p>
      <p className="truncate font-mono text-xs text-muted-foreground" title={code}>
        {code}
      </p>
      <p className="mt-1 line-clamp-2 break-words text-xs text-muted-foreground">{detail}</p>
    </TableCell>
  );
}

export function SmsVariablesCell({ variables }: { variables: string[] }) {
  const visible = variables.slice(0, 2);
  return (
    <TableCell className="align-top whitespace-normal">
      <div className="flex max-w-full flex-wrap gap-1 overflow-hidden">
        {visible.map((variable) => (
          <Badge key={variable} variant="outline" className="max-w-full truncate font-mono text-xs">
            {`{{${variable}}}`}
          </Badge>
        ))}
        {variables.length > visible.length ? (
          <Badge variant="secondary">+{variables.length - visible.length}</Badge>
        ) : null}
        {!variables.length ? <span className="text-xs text-muted-foreground">None</span> : null}
      </div>
    </TableCell>
  );
}

export function SmsDefinitionActionCell({
  disabled,
  onEdit,
}: {
  disabled: boolean;
  onEdit: () => void;
}) {
  return (
    <TableCell className="align-top whitespace-normal text-right">
      <Button type="button" size="sm" variant="outline" onClick={onEdit} disabled={disabled}>
        Edit
      </Button>
    </TableCell>
  );
}
