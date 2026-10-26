import { MAINTENANCE_SCRIPTS, type MaintenanceParams } from '@/shared/maintenance';
import { BadRequest, NotFound } from '@/server/utils/http-error';

export function validateMaintenanceParams(operationId: string, params: MaintenanceParams) {
  const script = MAINTENANCE_SCRIPTS.find((item) => item.id === operationId);
  if (!script) throw NotFound('Maintenance script not found');
  const fields = new Set(script.fields.map((field) => field.name));
  if (Object.keys(params).some((key) => !fields.has(key)))
    throw BadRequest('Unsupported script parameter');
  const normalized: MaintenanceParams = {};
  for (const field of script.fields) {
    const value = params[field.name];
    if (!field.required && (value === undefined || (typeof value === 'string' && !value.trim())))
      continue;
    if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9-]{2,79}$/.test(value.trim())) {
      throw BadRequest(`Enter a valid ${field.label.toLowerCase()}`);
    }
    normalized[field.name] = value.trim();
  }
  return { script, params: normalized };
}
