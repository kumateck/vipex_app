import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  SELF_SERVICE_TERMS_SECTIONS,
  SELF_SERVICE_TERMS_VERSION,
} from '@/shared/self-service/terms';

type SelfServiceTermsDialogProps = {
  trigger: ReactNode;
};

export function SelfServiceTermsDialog({ trigger }: SelfServiceTermsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[88svh] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden border-white/10 bg-[#211f28] p-0 text-white sm:max-w-2xl">
        <DialogHeader className="border-b border-white/10 px-5 py-5 pr-12 sm:px-6">
          <DialogTitle className="text-xl">VIPex Courier Service Terms & Conditions</DialogTitle>
          <DialogDescription className="text-white/55">
            These terms apply immediately when you submit this booking. Version{' '}
            {SELF_SERVICE_TERMS_VERSION}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto px-5 py-5 text-sm leading-6 sm:px-6">
          {SELF_SERVICE_TERMS_SECTIONS.map((section) => (
            <section key={section.title} className="space-y-2">
              <h3 className="font-semibold text-white">{section.title}</h3>
              <ul className="space-y-2 pl-5 text-white/70">
                {section.items.map((item) => (
                  <li key={item} className="list-disc pl-1">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="space-y-2 rounded-xl border border-white/10 bg-white/[0.05] p-4">
            <h3 className="font-semibold text-white">Sender’s Declaration</h3>
            <p className="text-white/70">
              By submitting this booking, the sender confirms that they have read, understood, and
              agreed to all the terms and conditions stated above.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-white">Collection of Parcels</h3>
            <p className="text-white/70">
              Receivers must present valid photo identification before parcels are released. Where a
              parcel is collected by a third party on behalf of the recipient, the third party must
              present their own valid photo identification and the identification details of the
              intended recipient.
            </p>
          </section>
        </div>

        <DialogFooter className="border-t border-white/10 bg-[#211f28] px-5 py-4 sm:px-6">
          <DialogClose asChild>
            <Button type="button" className="bg-[#ef3340] text-white hover:bg-[#ff4652]">
              Done reading
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
