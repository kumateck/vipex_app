import { useEffect, useState, type ComponentProps } from 'react';
import { router } from '@mobile/navigation/router-compat';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppScreen } from '@mobile/components/screen';
import {
  listCommunicationChannels,
  listCommunicationThreads,
  listMobileUserOptions,
  searchParcels,
} from '@mobile/lib/api';
import { notifyError } from '@mobile/lib/notify';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { useAuth } from '@mobile/providers/auth-provider';
import { AppButton, AppCard, AppInput, AppLabel, AppPageHeader } from '@/components/ui/mobile';
import { loadGlobalSearchHistory, pushGlobalSearchHistory } from '@mobile/lib/communication-local';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

type SearchResults = {
  parcels: Array<{ id: string; bookingCode: string; parcelDetails: string }>;
  threads: Array<{ id: string; title: string | null }>;
  channels: Array<{ id: string; name: string; channelType: string; threadId: string | null }>;
  users: Array<{ id: string; fullname: string; email: string }>;
};

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type ResultRowData = {
  id: string;
  icon: IoniconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

function ResultRow({ icon, title, subtitle, onPress, first }: ResultRowData & { first?: boolean }) {
  const { theme } = useAppearance();

  const inner = (
    <View
      style={[
        styles.resultRow,
        !first && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.separator,
        },
      ]}
    >
      <View style={[styles.resultIcon, { backgroundColor: `${theme.colors.secondary}1F` }]}>
        <Ionicons name={icon} size={16} color={theme.colors.secondary} />
      </View>
      <View style={styles.resultMain}>
        <Text style={[styles.resultTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.resultSubtitle, { color: theme.colors.textMuted }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSubtle} />
      ) : null}
    </View>
  );

  if (!onPress) return inner;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {inner}
    </Pressable>
  );
}

export default function GlobalSearchScreen() {
  const { theme } = useAppearance();
  const { withAuth, session } = useAuth();
  const companyId = session.user?.company?.id ?? session.user?.companyId;
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResults>({
    parcels: [],
    threads: [],
    channels: [],
    users: [],
  });

  useEffect(() => {
    void (async () => {
      const next = await loadGlobalSearchHistory();
      setHistory(next);
    })();
  }, []);

  const totalCount =
    results.parcels.length +
    results.threads.length +
    results.channels.length +
    results.users.length;

  const runSearch = async (value?: string) => {
    const term = (value ?? query).trim();
    if (!term || !companyId) return;
    setLoading(true);
    try {
      const data = await withAuth(async (token) => {
        const [parcelRes, threads, channels, users] = await Promise.all([
          searchParcels(token, {
            search: term,
            companyId,
            includeDeleted: true,
            page: 1,
            pageSize: 20,
          }),
          listCommunicationThreads(token),
          listCommunicationChannels(token),
          listMobileUserOptions(token),
        ]);
        const filterText = term.toLowerCase();
        return {
          parcels: (parcelRes.data ?? []).map((row) => ({
            id: row.id,
            bookingCode: row.bookingCode,
            parcelDetails: row.parcelDetails,
          })),
          threads: threads.filter((item) =>
            `${item.title ?? ''}`.toLowerCase().includes(filterText),
          ),
          channels: channels.filter((item) =>
            `${item.name} ${item.description ?? ''}`.toLowerCase().includes(filterText),
          ),
          users: users.filter((item) =>
            `${item.fullname} ${item.email}`.toLowerCase().includes(filterText),
          ),
        };
      });
      setResults(data);
      await pushGlobalSearchHistory(term);
      setHistory(await loadGlobalSearchHistory());
    } catch (error) {
      notifyError(
        'Global search failed',
        error instanceof Error ? error.message : 'Unable to search',
      );
    } finally {
      setLoading(false);
    }
  };

  const resultRows: ResultRowData[] = [
    ...results.parcels.map((item) => ({
      id: `parcel-${item.id}`,
      icon: 'cube-outline' as IoniconName,
      title: `Parcel • ${item.bookingCode}`,
      subtitle: item.parcelDetails,
      onPress: () =>
        router.push({
          pathname: '/super-search/[parcelId]' as never,
          params: { parcelId: item.id },
        }),
    })),
    ...results.channels.map((item) => ({
      id: `channel-${item.id}`,
      icon: (item.channelType === 'voice' ? 'call-outline' : 'chatbubbles-outline') as IoniconName,
      title: `Channel • ${item.name}`,
      subtitle: item.channelType,
      onPress: () => {
        if (item.channelType === 'voice') {
          router.push({
            pathname: '/communication/voice/[channelId]' as never,
            params: { channelId: item.id, name: item.name },
          });
          return;
        }
        if (!item.threadId) return;
        router.push({
          pathname: '/communication/thread/[threadId]' as never,
          params: { threadId: item.threadId, title: `#${item.name}`, threadType: 'channel' },
        });
      },
    })),
    ...results.threads.map((item) => ({
      id: `thread-${item.id}`,
      icon: 'chatbox-outline' as IoniconName,
      title: `Thread • ${item.title ?? 'Untitled'}`,
      onPress: () =>
        router.push({
          pathname: '/communication/thread/[threadId]' as never,
          params: { threadId: item.id, title: item.title ?? 'Thread' },
        }),
    })),
    ...results.users.map((item) => ({
      id: `user-${item.id}`,
      icon: 'person-outline' as IoniconName,
      title: `User • ${item.fullname}`,
      subtitle: item.email,
    })),
  ];

  return (
    <AppScreen refreshing={loading} onRefresh={() => void runSearch()}>
      <AppPageHeader
        title="Global Search"
        subtitle="Parcels, channels, threads, and users in one place."
      />

      <AppCard>
        <AppInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search..."
          autoCapitalize="none"
        />
        <View style={styles.row}>
          <AppButton
            title={loading ? 'Searching...' : 'Search'}
            onPress={() => void runSearch()}
            disabled={loading || query.trim().length === 0}
          />
          <AppButton
            title="Clear"
            onPress={() => {
              setQuery('');
              setResults({ parcels: [], threads: [], channels: [], users: [] });
            }}
            variant="secondary"
          />
        </View>
      </AppCard>

      {history.length ? (
        <AppCard>
          <AppLabel>Recent</AppLabel>
          <View style={styles.historyWrap}>
            {history.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  setQuery(item);
                  void runSearch(item);
                }}
                style={[styles.historyPill, { backgroundColor: theme.colors.cardMuted }]}
              >
                <Text style={[styles.historyPillText, { color: theme.colors.text }]}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </AppCard>
      ) : null}

      <AppCard>
        <AppLabel>Results ({totalCount})</AppLabel>
        {resultRows.map((row, index) => (
          <ResultRow key={row.id} {...row} first={index === 0} />
        ))}
        {!totalCount ? (
          <Text style={[styles.empty, { color: theme.colors.textSubtle }]}>No results yet.</Text>
        ) : null}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  historyWrap: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  historyPill: {
    borderRadius: mobileRadius.pill,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: mobileSpacing.xs + 2,
  },
  historyPillText: { ...mobileTextStyles.footnote, fontWeight: '600' },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileSpacing.sm,
    paddingVertical: mobileSpacing.sm,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: mobileRadius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultMain: { flex: 1, gap: 1 },
  resultTitle: { ...mobileTextStyles.subhead, fontWeight: '700' },
  resultSubtitle: { ...mobileTextStyles.footnote },
  empty: { ...mobileTextStyles.subhead, textAlign: 'center', paddingVertical: mobileSpacing.sm },
});
