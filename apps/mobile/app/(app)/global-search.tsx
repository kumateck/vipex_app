import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import { AppButton, AppCard, AppInput } from '@/components/ui/mobile';
import { loadGlobalSearchHistory, pushGlobalSearchHistory } from '@mobile/lib/communication-local';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';

type SearchResults = {
  parcels: Array<{ id: string; bookingCode: string; parcelDetails: string }>;
  threads: Array<{ id: string; title: string | null }>;
  channels: Array<{ id: string; name: string; channelType: string; threadId: string | null }>;
  users: Array<{ id: string; fullname: string; email: string }>;
};

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

  return (
    <AppScreen refreshing={loading} onRefresh={() => void runSearch()}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Global Search</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSubtle }]}>
        Parcels, channels, threads, and users in one place.
      </Text>

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
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Recent</Text>
          <View style={styles.historyWrap}>
            {history.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  setQuery(item);
                  void runSearch(item);
                }}
                style={[styles.historyPill, { borderColor: theme.colors.border }]}
              >
                <Text style={{ color: theme.colors.text }}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </AppCard>
      ) : null}

      <AppCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
          Results ({totalCount})
        </Text>
        {results.parcels.map((item) => (
          <Pressable
            key={`parcel-${item.id}`}
            onPress={() =>
              router.push({
                pathname: '/super-search/[parcelId]' as never,
                params: { parcelId: item.id },
              })
            }
            style={[styles.resultRow, { borderColor: theme.colors.border }]}
          >
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
              Parcel • {item.bookingCode}
            </Text>
            <Text style={{ color: theme.colors.textMuted }}>{item.parcelDetails}</Text>
          </Pressable>
        ))}
        {results.channels.map((item) => (
          <Pressable
            key={`channel-${item.id}`}
            onPress={() => {
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
                params: { threadId: item.threadId, title: `#${item.name}` },
              });
            }}
            style={[styles.resultRow, { borderColor: theme.colors.border }]}
          >
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
              Channel • {item.name}
            </Text>
            <Text style={{ color: theme.colors.textMuted }}>{item.channelType}</Text>
          </Pressable>
        ))}
        {results.threads.map((item) => (
          <Pressable
            key={`thread-${item.id}`}
            onPress={() =>
              router.push({
                pathname: '/communication/thread/[threadId]' as never,
                params: { threadId: item.id, title: item.title ?? 'Thread' },
              })
            }
            style={[styles.resultRow, { borderColor: theme.colors.border }]}
          >
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
              Thread • {item.title ?? 'Untitled'}
            </Text>
          </Pressable>
        ))}
        {results.users.map((item) => (
          <View
            key={`user-${item.id}`}
            style={[styles.resultRow, { borderColor: theme.colors.border }]}
          >
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
              User • {item.fullname}
            </Text>
            <Text style={{ color: theme.colors.textMuted }}>{item.email}</Text>
          </View>
        ))}
        {!totalCount ? (
          <Text style={{ color: theme.colors.textSubtle }}>No results yet.</Text>
        ) : null}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: mobileTypography.title, fontWeight: '800' },
  subtitle: { marginTop: -2, lineHeight: 20, marginBottom: mobileSpacing.xs },
  sectionTitle: { fontSize: mobileTypography.sectionTitle, fontWeight: '700' },
  row: { flexDirection: 'row', gap: mobileSpacing.sm, flexWrap: 'wrap' },
  historyWrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  historyPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resultRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: mobileSpacing.sm,
    gap: 2,
  },
});
