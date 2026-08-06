import { Text, View, useWindowDimensions } from 'react-native';
import { AppButton, AppCard } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileTextStyles } from '@mobile/theme/layout';
import type { UserChatEntry } from '@mobile/features/communication/types/hub';
import { EmptyText, SectionTitle, hubStyles, initialsFromName } from '../hub-ui';
import { getMobileScale } from '@mobile/features/communication/utils';

export function UsersTabPane({
  userEntries,
  selectedRequestTargetId,
  startingUserId,
  onOpenThread,
  onSelectForRequest,
  onStartChat,
}: {
  userEntries: UserChatEntry[];
  selectedRequestTargetId: string | null;
  startingUserId: string | null;
  onOpenThread: (threadId: string) => void;
  onSelectForRequest: (userId: string) => void;
  onStartChat: (entry: UserChatEntry) => void;
}) {
  const { theme } = useAppearance();
  const { width } = useWindowDimensions();
  const scale = getMobileScale(width);
  const avatarSize = 50 * scale;

  return (
    <>
      <SectionTitle title="People You Can Reach" />
      {userEntries.length ? (
        userEntries.map((entry) => (
          <AppCard key={entry.id}>
            <View style={hubStyles.userRow}>
              <View style={[hubStyles.avatarWrap, { width: avatarSize, height: avatarSize }]}>
                <View
                  style={[
                    hubStyles.avatarCircle,
                    {
                      backgroundColor: theme.colors.bgElevated,
                      borderColor: theme.colors.border,
                      borderWidth: 1,
                      width: avatarSize,
                      height: avatarSize,
                      borderRadius: avatarSize / 2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      hubStyles.avatarText,
                      {
                        color: theme.colors.textMuted,
                        fontSize: mobileTextStyles.headline.fontSize * scale,
                      },
                    ]}
                  >
                    {initialsFromName(entry.fullname)}
                  </Text>
                </View>
              </View>
              <View style={hubStyles.waCenter}>
                <Text
                  numberOfLines={1}
                  style={[
                    hubStyles.waName,
                    {
                      color: theme.colors.text,
                      fontSize: mobileTextStyles.title3.fontSize * scale,
                      lineHeight: mobileTextStyles.title3.lineHeight * scale,
                    },
                  ]}
                >
                  {entry.fullname}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    hubStyles.waMeta,
                    {
                      color: theme.colors.textSubtle,
                      fontSize: mobileTextStyles.footnote.fontSize * scale,
                      lineHeight: mobileTextStyles.footnote.lineHeight * scale,
                    },
                  ]}
                >
                  {[entry.roleName, entry.branchName, entry.locationName]
                    .filter(Boolean)
                    .join(' • ') || 'No profile metadata'}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    hubStyles.waPreview,
                    {
                      color: theme.colors.textMuted,
                      fontSize: mobileTextStyles.subhead.fontSize * scale,
                      lineHeight: mobileTextStyles.subhead.lineHeight * scale,
                    },
                  ]}
                >
                  {entry.thread ? 'Existing conversation' : 'No conversation yet'}
                </Text>
              </View>
              {entry.thread ? (
                <AppButton title="Open" onPress={() => onOpenThread(entry.thread!.id)} />
              ) : entry.requiresRequest ? (
                <AppButton
                  title={selectedRequestTargetId === entry.id ? 'Selected' : 'Request'}
                  onPress={() => onSelectForRequest(entry.id)}
                  disabled={!entry.canRequest}
                  variant="secondary"
                />
              ) : (
                <AppButton
                  title={startingUserId === entry.id ? 'Starting...' : 'Chat'}
                  onPress={() => onStartChat(entry)}
                  disabled={startingUserId === entry.id}
                />
              )}
            </View>
          </AppCard>
        ))
      ) : (
        <EmptyText value="No users available." />
      )}
    </>
  );
}
