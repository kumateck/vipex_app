import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton, AppCard, AppInput } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
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
        <View style={{ gap: mobileSpacing.sm }}>
          <Pressable
            onPress={() => setIsTargetDropdownOpen((prev) => !prev)}
            style={[
              styles.dropdownPill,
              {
                backgroundColor: theme.colors.cardMuted,
                borderColor: theme.scheme === 'dark' ? theme.colors.border : 'transparent',
                borderWidth: theme.scheme === 'dark' ? StyleSheet.hairlineWidth : 0,
              },
            ]}
          >
            <View style={{ flex: 1, paddingRight: mobileSpacing.sm + 2 }}>
              <Text
                numberOfLines={1}
                style={[
                  styles.dropdownPillLabel,
                  { color: selectedRequestTarget ? theme.colors.text : theme.colors.textSubtle },
                ]}
              >
                {selectedRequestTarget ? selectedRequestTarget.fullname : 'Select one user'}
              </Text>
              {selectedTargetMeta ? (
                <Text
                  numberOfLines={1}
                  style={[styles.dropdownPillMeta, { color: theme.colors.textSubtle }]}
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
              style={[
                styles.dropdownList,
                mobileShadow.floating,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.scheme === 'dark' ? theme.colors.border : 'transparent',
                  borderWidth: theme.scheme === 'dark' ? StyleSheet.hairlineWidth : 0,
                },
              ]}
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
                        style={[
                          styles.dropdownItem,
                          {
                            borderBottomColor: theme.colors.separator,
                            backgroundColor: selected ? theme.colors.cardMuted : 'transparent',
                          },
                        ]}
                      >
                        <Text style={[styles.dropdownPillLabel, { color: theme.colors.text }]}>
                          {entry.fullname}
                        </Text>
                        {meta ? (
                          <Text
                            style={[styles.dropdownPillMeta, { color: theme.colors.textSubtle }]}
                          >
                            {meta}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })
                ) : (
                  <Text style={[styles.dropdownEmpty, { color: theme.colors.textSubtle }]}>
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

const styles = StyleSheet.create({
  dropdownPill: {
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: mobileSpacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownPillLabel: { ...mobileTextStyles.footnote, fontWeight: '700' },
  dropdownPillMeta: { ...mobileTextStyles.caption2, marginTop: 2 },
  dropdownList: {
    borderRadius: mobileRadius.md,
    maxHeight: 220,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: mobileSpacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownEmpty: {
    ...mobileTextStyles.subhead,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: mobileSpacing.sm + 2,
  },
});
