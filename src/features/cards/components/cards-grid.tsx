import { useState } from 'react';
import {
  MoreVertical,
  CreditCard,
  User,
  Landmark,
  ShieldCheck,
  GraduationCap,
  Globe,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { useListCardsQuery } from '../api/cards.api';
import { useDeleteCardAction } from '../hooks/use-card-actions';
import type { Card } from '../types/card.types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CardsGridProps {
  onEdit: (card: Card) => void;
}

export function CardsGrid({ onEdit }: CardsGridProps) {
  const companyId = useAuthStore((state) => state.user?.company?.id ?? null);
  const { data: cardsData, isLoading } = useListCardsQuery(
    { filters: { companyId } },
    { skip: !companyId },
  );

  const { onDelete, isDeleting } = useDeleteCardAction();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const cards = cardsData?.data ?? [];

  if (cards.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
        <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p>No cards found. Create your first identification card to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <CardItem
          key={card.id}
          card={card}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      ))}
    </div>
  );
}

function CardItem({
  card,
  onEdit,
  onDelete,
  isDeleting,
}: {
  card: Card;
  onEdit: (card: Card) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const getCardStyle = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('ghana card') || lowerName.includes('national identification')) {
      return {
        bg: 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600',
        text: 'text-amber-950',
        icon: ShieldCheck,
        pattern: 'opacity-10',
        label: 'NATIONAL ID',
      };
    }
    if (lowerName.includes('passport')) {
      return {
        bg: 'bg-gradient-to-br from-red-800 via-red-900 to-red-950',
        text: 'text-red-50',
        icon: Globe,
        pattern: 'opacity-20',
        label: 'PASSPORT',
      };
    }
    if (lowerName.includes('voter')) {
      return {
        bg: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700',
        text: 'text-blue-50',
        icon: User,
        pattern: 'opacity-10',
        label: 'VOTER ID',
      };
    }
    if (lowerName.includes('nhis')) {
      return {
        bg: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700',
        text: 'text-emerald-50',
        icon: Landmark,
        pattern: 'opacity-10',
        label: 'HEALTH INSURANCE',
      };
    }
    if (lowerName.includes('ssnit')) {
      return {
        bg: 'bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800',
        text: 'text-sky-50',
        icon: Landmark,
        pattern: 'opacity-10',
        label: 'SSNIT CARD',
      };
    }
    if (lowerName.includes('license') || lowerName.includes('driver')) {
      return {
        bg: 'bg-gradient-to-br from-stone-400 via-stone-500 to-stone-600',
        text: 'text-stone-950',
        icon: Globe,
        pattern: 'opacity-10',
        label: 'DRIVER LICENSE',
      };
    }
    if (lowerName.includes('student')) {
      return {
        bg: 'bg-gradient-to-br from-violet-500 via-violet-600 to-purple-700',
        text: 'text-violet-50',
        icon: GraduationCap,
        pattern: 'opacity-10',
        label: 'STUDENT ID',
      };
    }
    return {
      bg: 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900',
      text: 'text-slate-50',
      icon: CreditCard,
      pattern: 'opacity-10',
      label: 'ID CARD',
    };
  };

  const style = getCardStyle(card.name);
  const Icon = style.icon;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <div
      className={`relative h-48 w-full rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-2xl hover:-translate-y-1 ${style.bg} ${style.text}`}
    >
      {/* Background Pattern Simulation */}
      <div
        className={`absolute inset-0 pointer-events-none flex items-center justify-center ${style.pattern}`}
      >
        <Icon size={120} strokeWidth={0.5} />
      </div>

      {/* Card Content */}
      <div className="relative h-full p-5 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-[0.2em] opacity-80 mb-1">
              {style.label}
            </span>
            <div className="flex items-center gap-2">
              <Icon size={18} />
              <h3 className="font-bold text-lg tracking-tight leading-tight uppercase">
                {card.name}
              </h3>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-inherit hover:bg-white/20 rounded-full"
              >
                <MoreVertical size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => onEdit(card)}>Edit Card</DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isDeleting}
              >
                Delete Card
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-auto">
          <div className="h-10 w-14 bg-white/20 rounded-md backdrop-blur-sm border border-white/10 flex items-center justify-center mb-4">
            <div className="h-6 w-8 bg-amber-400/40 rounded-sm overflow-hidden flex flex-col gap-[2px] p-[2px]">
              <div className="h-full w-full bg-amber-200/50 rounded-[1px]" />
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <div className="h-1 w-24 bg-white/20 rounded-full" />
              <div className="h-1 w-16 bg-white/20 rounded-full" />
            </div>
            <span className="text-[10px] font-mono opacity-60">VIPEX SECURE ID</span>
          </div>
        </div>
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete card?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{card.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                onDelete(card.id);
                setIsDeleteDialogOpen(false);
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete Card'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CardSkeleton() {
  return <div className="h-48 w-full rounded-xl bg-muted animate-pulse border border-border" />;
}
