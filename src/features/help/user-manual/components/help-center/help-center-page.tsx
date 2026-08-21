import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useHelpCenter } from '../../hooks/use-help-center';
import { HelpAssistantPanel } from './help-assistant-panel';
import { HelpGuideDetail } from './help-guide-detail';

export function HelpCenterPage() {
  const help = useHelpCenter();

  return (
    <ScrollableWrapper>
      <main className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
        <HelpAssistantPanel onSelectGuide={help.selectGuide} />
        <HelpGuideDetail guide={help.selectedGuide} onSelectGuide={help.selectGuide} />
      </main>
    </ScrollableWrapper>
  );
}
