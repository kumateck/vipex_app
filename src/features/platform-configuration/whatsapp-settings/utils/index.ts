import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';

export function getWhatsAppSettingsErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) {
  return getErrorMessage(error, fallback);
}
export {
  DEFAULT_TEST_TEMPLATE,
  HELLO_WORLD_TEST_TEMPLATE,
  buildWhatsAppTestTemplateOptions,
  type WhatsAppTestTemplateOption,
} from './test-template-options';
