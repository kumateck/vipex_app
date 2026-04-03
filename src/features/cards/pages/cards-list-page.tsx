import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardsGrid } from '../components/cards-grid';
import { CardModal } from '../components/card-modal';
import type { Card } from '../types/card.types';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function CardsListPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  return (
    <>
      <ScrollableWrapper>
        <div className="w-full p-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsCreateOpen(true)}>New card</Button>
          </div>
          <CardsGrid onEdit={setEditingCard} />
        </div>
      </ScrollableWrapper>
      <CardModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <CardModal
        open={!!editingCard}
        onOpenChange={(open) => !open && setEditingCard(null)}
        card={editingCard}
      />
    </>
  );
}
