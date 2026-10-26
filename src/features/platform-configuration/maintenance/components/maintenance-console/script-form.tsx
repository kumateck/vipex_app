import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { MaintenanceConsoleState } from '../../hooks';

export function ScriptForm({ state }: { state: MaintenanceConsoleState }) {
  const script = state.selected;
  if (!script) return null;
  return (
    <form
      className="space-y-5"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void state.run('preview');
      }}
    >
      <div>
        <h2 className="text-lg font-semibold">{script.title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{script.description}</p>
      </div>
      {script.fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={`maintenance-${field.name}`}>
            {field.label}
            {!field.required ? ' (optional)' : ''}
          </Label>
          <Input
            id={`maintenance-${field.name}`}
            value={String(state.params[field.name] ?? '')}
            onChange={(event) => state.updateParam(field.name, event.target.value)}
            placeholder={field.placeholder}
            maxLength={80}
            required={field.required}
            disabled={state.busy}
            autoComplete="off"
            aria-describedby={field.description ? `maintenance-${field.name}-help` : undefined}
            className="max-w-md"
          />
          {field.description ? (
            <p id={`maintenance-${field.name}-help`} className="text-xs text-muted-foreground">
              {field.description}
            </p>
          ) : null}
        </div>
      ))}
      {!script.fields.length ? (
        <p className="text-sm text-muted-foreground">
          This script uses your current company. No parameters are needed.
        </p>
      ) : null}
      <Button type="submit" disabled={!state.canPreview}>
        {state.busy ? <Spinner /> : null}
        {state.busy
          ? 'Running script…'
          : script.kind === 'repair'
            ? 'Preview repair'
            : 'Run inspection'}
      </Button>
      {state.hasExecutablePreview ? (
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="maintenance-confirmation"
              checked={state.confirmed}
              disabled={state.busy}
              onCheckedChange={(checked) => state.setConfirmed(checked === true)}
            />
            <Label htmlFor="maintenance-confirmation" className="text-sm leading-relaxed">
              {script.confirmation ??
                'I reviewed the preview and confirm these changes should be applied.'}
            </Label>
          </div>
          <Button
            type="button"
            variant="destructive"
            disabled={!state.canExecute}
            onClick={() => void state.run('execute')}
          >
            Execute repair
          </Button>
          <p className="text-xs text-muted-foreground">
            The server rechecks the records before applying the preview. Previews expire after 10
            minutes.
          </p>
        </div>
      ) : null}
    </form>
  );
}
