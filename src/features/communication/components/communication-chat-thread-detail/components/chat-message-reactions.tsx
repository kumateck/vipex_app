type ChatMessageReactionsProps = {
  isOwnMessage: boolean;
  reactions: Array<{ emoji: string; count: number }>;
  isActive: boolean;
  onOpenPicker: () => void;
};

export function ChatMessageReactions({
  isOwnMessage,
  reactions,
  isActive,
  onOpenPicker,
}: ChatMessageReactionsProps) {
  if (!reactions.length) return null;
  const visible = reactions.slice(0, 3);
  const totalCount = reactions.reduce((acc, item) => acc + item.count, 0);

  return (
    <button
      type="button"
      onClick={onOpenPicker}
      className={`absolute -bottom-3 z-20 inline-flex items-center gap-1 rounded-full bg-white px-2 py-[2px] text-sm shadow-sm transition-all duration-75 hover:scale-105 hover:shadow-md dark:bg-[#1f2c34] ${
        isActive ? 'bg-sky-50 dark:bg-[#27363f]' : ''
      } ${isOwnMessage ? 'right-2' : 'left-2'}`}
    >
      {visible.map((reaction) => (
        <span key={`reaction-pill-${reaction.emoji}`} className="inline-flex items-center gap-0.5">
          <span>{reaction.emoji}</span>
          {reaction.count > 1 ? (
            <span className="text-[10px] text-muted-foreground">{reaction.count}</span>
          ) : null}
        </span>
      ))}
      {totalCount > visible.length ? (
        <span className="ml-1 rounded-full bg-black/5 px-1 text-[10px] text-muted-foreground dark:bg-white/10">
          {totalCount}
        </span>
      ) : null}
    </button>
  );
}
