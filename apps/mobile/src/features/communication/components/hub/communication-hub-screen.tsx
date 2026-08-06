import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { AppScreen } from '@mobile/components/screen';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { AppSkeletonCard } from '@/components/ui/mobile';
import { useCommunicationHub } from '@mobile/features/communication/hooks';
import { mobileSpacing } from '@mobile/theme/layout';
import { HubHeader, HubTabBar } from './hub-ui';
import { ChatsTabPane, ChannelsTabPane, UsersTabPane, RequestsTabPane } from './tabs';

export function CommunicationHubScreen() {
  const { theme } = useAppearance();
  const hub = useCommunicationHub();
  const navigation = useNavigation();

  return (
    <AppScreen scrollable={false}>
      <View style={styles.header}>
        <HubHeader onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())} />
        <HubTabBar activeTab={hub.activeTab} onChange={hub.setActiveTab} />
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={hub.loading}
            onRefresh={() => void hub.loadData()}
            tintColor={theme.colors.primary}
          />
        }
      >
        {hub.loading ? (
          <>
            <AppSkeletonCard lines={3} />
            <AppSkeletonCard lines={3} />
            <AppSkeletonCard lines={3} />
          </>
        ) : null}

        {!hub.loading && hub.activeTab === 'chats' ? (
          <ChatsTabPane
            chatEntries={hub.chatEntries}
            groupThreads={hub.groupThreads}
            threadUnreadById={hub.data.threadUnreadById}
            typingByThreadId={hub.typingByThreadId}
            onOpenThread={hub.openThread}
          />
        ) : null}

        {!hub.loading && hub.activeTab === 'channels' ? (
          <ChannelsTabPane
            textChannels={hub.data.textChannels}
            voiceChannels={hub.data.voiceChannels}
            threadUnreadById={hub.data.threadUnreadById}
            voiceUnreadById={hub.data.voiceUnreadById}
            channelNotifModes={hub.channelNotifModes}
            activeCallByChannelId={hub.activeCallByChannelId}
            callOccupancyByCallId={hub.callOccupancyByCallId}
            joiningChannelId={hub.joiningChannelId}
            onOpenTextChannel={hub.openTextChannel}
            onCycleNotificationMode={(channelId) => void hub.cycleNotificationMode(channelId)}
            onJoinVoice={(channel) => void hub.joinVoice(channel)}
          />
        ) : null}

        {!hub.loading && hub.activeTab === 'users' ? (
          <UsersTabPane
            userEntries={hub.userEntries}
            selectedRequestTargetId={hub.selectedRequestTargetId}
            startingUserId={hub.startingUserId}
            onOpenThread={hub.openThreadById}
            onSelectForRequest={(id) => {
              hub.setSelectedRequestTargetId(id);
              hub.setActiveTab('requests');
            }}
            onStartChat={(entry) => void hub.startDirectChat(entry)}
          />
        ) : null}

        {!hub.loading && hub.activeTab === 'requests' ? (
          <RequestsTabPane
            requestableUsers={hub.requestableUsers}
            selectedRequestTargetId={hub.selectedRequestTargetId}
            requestReasonNote={hub.requestReasonNote}
            isSubmittingRequest={hub.isSubmittingRequest}
            incomingRequests={hub.data.incomingRequests}
            outgoingRequests={hub.data.outgoingRequests}
            decidingRequestId={hub.decidingRequestId}
            onSelectRequestTarget={hub.setSelectedRequestTargetId}
            onChangeReason={hub.setRequestReasonNote}
            onSubmitRequest={() => void hub.submitChatRequest()}
            onDecideRequest={(requestId, approve) => void hub.decideRequest(requestId, approve)}
          />
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { gap: mobileSpacing.xs, paddingBottom: 2 },
  contentScroll: { flex: 1 },
  contentContainer: { gap: mobileSpacing.sm, paddingBottom: mobileSpacing.xl },
});
