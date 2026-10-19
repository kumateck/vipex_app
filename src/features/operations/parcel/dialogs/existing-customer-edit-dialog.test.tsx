import { describe, expect, test } from 'bun:test';
import { ExistingCustomerEditDialog } from './existing-customer-edit-dialog';

describe('creation customer popup submit isolation', () => {
  test.each(['Sender', 'Receiver'])(
    '%s save stops submission reaching the booking form',
    async (customerLabel) => {
      let prevented = 0,
        stopped = 0,
        saved = 0;
      const element = ExistingCustomerEditDialog({
        open: true,
        onOpenChange: () => {},
        customerLabel,
        fullname: 'Correct name',
        primaryTelephone: '0551112222',
        secondaryTelephone: '',
        isSaving: false,
        onFullnameChange: () => {},
        onSecondaryTelephoneChange: () => {},
        onSave: async () => {
          saved++;
        },
      });
      const form = element.props.children.props.children;
      form.props.onSubmit({
        preventDefault: () => {
          prevented++;
        },
        stopPropagation: () => {
          stopped++;
        },
      });
      expect(prevented).toBe(1);
      expect(stopped).toBe(1);
      expect(saved).toBe(1);
    },
  );
});
