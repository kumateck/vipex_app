import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { MentionSuggestion } from '../types/communication-chat-thread-detail.types';

type ChatThreadMentionMenuProps = {
  isMentionMenuOpen: boolean;
  mentionSuggestions: MentionSuggestion[];
  activeMentionIndex: number;
  insertMentionSuggestion: (suggestion: MentionSuggestion) => void;
};

export function ChatThreadMentionMenu({
  isMentionMenuOpen,
  mentionSuggestions,
  activeMentionIndex,
  insertMentionSuggestion,
}: ChatThreadMentionMenuProps) {
  if (!isMentionMenuOpen) return null;

  return (
    <div className="absolute bottom-full z-30 mb-2 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
      <Command shouldFilter={false}>
        <CommandList>
          <CommandEmpty>No matching users.</CommandEmpty>
          <CommandGroup>
            {mentionSuggestions.map((suggestion, index) => (
              <CommandItem
                key={suggestion.key}
                value={`${suggestion.label} ${suggestion.subLabel}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  insertMentionSuggestion(suggestion);
                }}
                className={
                  index === activeMentionIndex ? 'bg-accent text-accent-foreground' : undefined
                }
              >
                <div className="flex w-full min-w-0 items-center justify-between gap-2">
                  <span className="truncate">{suggestion.label}</span>
                  <span className="text-xs text-muted-foreground">{suggestion.subLabel}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
