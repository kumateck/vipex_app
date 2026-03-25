import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardsGrid } from '../components/cards-grid';
import { CardModal } from '../components/card-modal';
import type { Card } from '../types/card.types';

export function CardsListPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  return (
    <>
      <div className="w-full p-4 space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateOpen(true)}>New card</Button>
        </div>
        <CardsGrid onEdit={setEditingCard} />
      </div>
      <CardModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <CardModal
        open={!!editingCard}
        onOpenChange={(open) => !open && setEditingCard(null)}
        card={editingCard}
      />
    </>
  );
}
