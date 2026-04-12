import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, AppCard, AppInput } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { CommunicationEngagementRequest } from '@mobile/types/communication';
import type { UserChatEntry } from '@mobile/features/communication/types/hub';
import { EmptyText, SectionTitle, formatTime, hubStyles } from '../hub-ui';

export function RequestsTabPane({
  requestableUsers,
  selectedRequestTargetId,
  requestReasonNote,
  isSubmittingRequest,
  incomingRequests,
  outgoingRequests,
  decidingRequestId,
  onSelectRequestTarget,
  onChangeReason,
  onSubmitRequest,
  onDecideRequest,
}: {
  requestableUsers: UserChatEntry[];
  selectedRequestTargetId: string | null;
  requestReasonNote: string;
  isSubmittingRequest: boolean;
  incomingRequests: CommunicationEngagementRequest[];
  outgoingRequests: CommunicationEngagementRequest[];
  decidingRequestId: string | null;
  onSelectRequestTarget: (id: string) => void;
  onChangeReason: (value: string) => void;
  onSubmitRequest: () => void;
  onDecideRequest: (requestId: string, approve: boolean) => void;
}) {
  const { theme } = useAppearance();
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);
  const selectedRequestTarget =
    requestableUsers.find((entry) => entry.id === selectedRequestTargetId) ?? null;
  const selectedTargetMeta = useMemo(
    () =>
      selectedRequestTarget
        ? [
            selectedRequestTarget.roleName,
            selectedRequestTarget.branchName,
            selectedRequestTarget.locationName,
          ]
            .filter(Boolean)
            .join(' • ')
        : '',
    [selectedRequestTarget],
  );

  return (
    <>
      <SectionTitle title="New Request" />
      <AppCard>
        <Text style={[hubStyles.rowSub, { color: theme.colors.textSubtle }]}>
          Bottom-up chat needs approval. Select one user and send request.
        </Text>
        <View style={{ gap: 8 }}>
          <Pressable
            onPress={() => setIsTargetDropdownOpen((prev) => !prev)}
            style={[
              hubStyles.requestTargetPill,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.cardMuted,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              },
            ]}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text
                numberOfLines={1}
                style={{
                  color: selectedRequestTarget ? theme.colors.text : theme.colors.textSubtle,
                  fontWeight: '700',
                  fontSize: 12,
                }}
              >
                {selectedRequestTarget ? selectedRequestTarget.fullname : 'Select one user'}
              </Text>
              {selectedTargetMeta ? (
                <Text
                  numberOfLines={1}
                  style={{ marginTop: 2, color: theme.colors.textSubtle, fontSize: 11 }}
                >
                  {selectedTargetMeta}
                </Text>
              ) : null}
            </View>
            <Ionicons
              name={isTargetDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.colors.textMuted}
            />
          </Pressable>

          {isTargetDropdownOpen ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 12,
                backgroundColor: theme.colors.card,
                maxHeight: 220,
              }}
            >
              <ScrollView>
                {requestableUsers.length ? (
                  requestableUsers.map((entry) => {
                    const selected = selectedRequestTargetId === entry.id;
                    const meta = [entry.roleName, entry.branchName, entry.locationName]
                      .filter(Boolean)
                      .join(' • ');
                    return (
                      <Pressable
                        key={entry.id}
                        onPress={() => {
                          onSelectRequestTarget(entry.id);
                          setIsTargetDropdownOpen(false);
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.colors.border,
                          backgroundColor: selected ? theme.colors.cardMuted : 'transparent',
                        }}
                      >
                        <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 12 }}>
                          {entry.fullname}
                        </Text>
                        {meta ? (
                          <Text
                            style={{ marginTop: 2, color: theme.colors.textSubtle, fontSize: 11 }}
                          >
                            {meta}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })
                ) : (
                  <Text
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: theme.colors.textSubtle,
                    }}
                  >
                    No users available.
                  </Text>
                )}
              </ScrollView>
            </View>
          ) : null}
        </View>
        <AppInput
          value={requestReasonNote}
          onChangeText={onChangeReason}
          placeholder={
            selectedRequestTarget
              ? `Reason for ${selectedRequestTarget.fullname} (optional)`
              : 'Select one user to request'
          }
        />
        <AppButton
          title={isSubmittingRequest ? 'Sending...' : 'Send Request'}
          onPress={onSubmitRequest}
          disabled={!selectedRequestTarget || isSubmittingRequest}
        />
      </AppCard>

      <SectionTitle title="Incoming Requests" />
      {incomingRequests.length ? (
        incomingRequests.map((request) => (
          <AppCard key={request.id}>
            <Text style={[hubStyles.rowTitle, { color: theme.colors.text }]}>
              {request.requesterFullname ?? 'Requester'}
            </Text>
            <Text style={[hubStyles.rowSub, { color: theme.colors.textSubtle }]}>
              {[
                request.requesterRoleName,
                request.requesterBranchName,
                request.requesterLocationName,
              ]
                .filter(Boolean)
                .join(' • ') || 'No profile metadata'}
            </Text>
            <Text style={[hubStyles.rowSub, { color: theme.colors.textSubtle }]}>
              {request.reasonNote?.trim() ? request.reasonNote : 'No reason provided'}
            </Text>
            <View style={hubStyles.controlsRow}>
              <AppButton
                title={decidingRequestId === request.id ? 'Approving...' : 'Approve'}
                onPress={() => onDecideRequest(request.id, true)}
                disabled={decidingRequestId === request.id}
              />
              <AppButton
                title={decidingRequestId === request.id ? 'Declining...' : 'Decline'}
                onPress={() => onDecideRequest(request.id, false)}
                disabled={decidingRequestId === request.id}
                variant="secondary"
              />
            </View>
          </AppCard>
        ))
      ) : (
        <EmptyText value="No incoming requests." />
      )}

      <SectionTitle title="Outgoing Requests" />
      {outgoingRequests.length ? (
        outgoingRequests.map((request) => (
          <AppCard key={request.id}>
            <Text style={[hubStyles.rowTitle, { color: theme.colors.text }]}>
              {request.targetFullname ?? 'Target user'}
            </Text>
            <Text style={[hubStyles.rowSub, { color: theme.colors.textSubtle }]}>
              {[request.targetRoleName, request.targetBranchName, request.targetLocationName]
                .filter(Boolean)
                .join(' • ') || 'No profile metadata'}
            </Text>
            <Text style={[hubStyles.rowSub, { color: theme.colors.textSubtle }]}>
              Sent {formatTime(request.createdAt)}
            </Text>
          </AppCard>
        ))
      ) : (
        <EmptyText value="No outgoing requests." />
      )}
    </>
  );
}
