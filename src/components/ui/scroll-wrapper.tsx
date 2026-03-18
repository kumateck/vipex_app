import React, { useEffect, useRef, useState } from 'react';

import { ScrollArea } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  className?: string;
}

const ScrollableWrapper = ({ children, className }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableHeight, setAvailableHeight] = useState<number>(0);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newHeight = window.innerHeight - rect.top;
        setAvailableHeight(newHeight);
      }
    };

    // Initial height calculation
    updateHeight();

    // Update height on window resize
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <div ref={containerRef} className={cn('max-w-full', className)}>
      <ScrollArea
        // Apply the dynamic height style
        style={{ maxHeight: availableHeight }}
        className="w-full overflow-auto"
      >
        {/* Attach ref to the inner wrapper (if ScrollArea doesn’t forward refs, wrap it in a div) */}
        <div className="pb-6">{children}</div>
      </ScrollArea>
    </div>
  );
};

export default ScrollableWrapper;
