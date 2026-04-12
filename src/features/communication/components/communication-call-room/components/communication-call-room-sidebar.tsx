import type { RefObject } from 'react';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import type {
  CommunicationCallSession,
  CommunicationMessage,
} from '../../../api/communication.api';
import type { CallParticipant } from '../types/communication-call-room.types';
import { formatDateTime } from '../utils/communication-call-room-utils';

type CommunicationCallRoomSidebarProps = {
  call: CommunicationCallSession;
  currentUserId: string;
  userLabelById: Map<string, string>;
  callChatMessages: CommunicationMessage[];
  callChatInput: string;
  setCallChatInput: (value: string) => void;
  callChatPanelOpen: boolean;
  setCallChatPanelOpen: (value: boolean) => void;
  unseenCallChatCount: number;
  callChatViewportRef: RefObject<HTMLDivElement | null>;
  isSendingCallChatMessage: boolean;
  onSendCallChatMessage: () => void;
  isUpdatingStatus: boolean;
  onChangeStatus: (status: 'pending' | 'ringing' | 'active' | 'ended' | 'cancelled') => void;
  selectedAudioInputDeviceId: string;
  selectedVideoInputDeviceId: string;
  selectedAudioOutputDeviceId: string;
  audioInputDevices: MediaDeviceInfo[];
  videoInputDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
  onSelectAudioInput: (value: string) => void;
  onSelectVideoInput: (value: string) => void;
  onSelectAudioOutput: (value: string) => void;
  participants: CallParticipant[];
  activeSpeakerUserIds: string[];
};

export function CommunicationCallRoomSidebar({
  call,
  currentUserId,
  userLabelById,
  callChatMessages,
  callChatInput,
  setCallChatInput,
  callChatPanelOpen,
  setCallChatPanelOpen,
  unseenCallChatCount,
  callChatViewportRef,
  isSendingCallChatMessage,
  onSendCallChatMessage,
  isUpdatingStatus,
  onChangeStatus,
  selectedAudioInputDeviceId,
  selectedVideoInputDeviceId,
  selectedAudioOutputDeviceId,
  audioInputDevices,
  videoInputDevices,
  audioOutputDevices,
  onSelectAudioInput,
  onSelectVideoInput,
  onSelectAudioOutput,
  participants,
  activeSpeakerUserIds,
}: CommunicationCallRoomSidebarProps) {
  return (
    <div className="min-h-0 overflow-y-auto pr-1">
      <div className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> In-call Chat
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCallChatPanelOpen(!callChatPanelOpen)}
              >
                {callChatPanelOpen ? 'Hide' : 'Show'}
                {unseenCallChatCount > 0 ? ` (${unseenCallChatCount})` : ''}
              </Button>
            </CardTitle>
          </CardHeader>
          {callChatPanelOpen ? (
            <CardContent className="space-y-2">
              <div
                ref={callChatViewportRef}
                className="max-h-52 space-y-2 overflow-y-auto rounded-md border bg-muted/10 p-2"
              >
                {callChatMessages.length ? (
                  callChatMessages.map((message) => {
                    const isOwn = message.senderUserId === currentUserId;
                    const label =
                      userLabelById.get(message.senderUserId ?? '') ?? message.senderName ?? 'User';
                    return (
                      <div
                        key={`call-chat-${message.id}`}
                        className={`rounded-md px-2 py-1 text-xs ${isOwn ? 'bg-primary/10' : 'bg-background'}`}
                      >
                        <p className="font-medium">{isOwn ? 'You' : label}</p>
                        <p className="mt-0.5 whitespace-pre-wrap text-muted-foreground">
                          {message.body ?? '(attachment)'}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground">No call chat messages yet.</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={callChatInput}
                  onChange={(event) => setCallChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      onSendCallChatMessage();
                    }
                  }}
                  className="h-8 flex-1 rounded-md border bg-background px-2 text-xs"
                  placeholder="Type in-call chat..."
                />
                <Button
                  size="sm"
                  onClick={onSendCallChatMessage}
                  disabled={isSendingCallChatMessage || !callChatInput.trim()}
                >
                  Send
                </Button>
              </div>
            </CardContent>
          ) : null}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Call Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Status</span>
              <Select
                value={call.status}
                onValueChange={(value) =>
                  onChangeStatus(value as 'pending' | 'ringing' | 'active' | 'ended' | 'cancelled')
                }
                disabled={isUpdatingStatus}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="ringing">Ringing</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Started</span>
              <span>{formatDateTime(call.startedAt)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Ended</span>
              <span>{formatDateTime(call.endedAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Devices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DeviceSelector
              label="Microphone"
              value={selectedAudioInputDeviceId || '__default__'}
              placeholder="Default microphone"
              defaultLabel="Default microphone"
              devices={audioInputDevices}
              onValueChange={onSelectAudioInput}
            />
            <DeviceSelector
              label="Camera"
              value={selectedVideoInputDeviceId || '__default__'}
              placeholder="Default camera"
              defaultLabel="Default camera"
              devices={videoInputDevices}
              onValueChange={onSelectVideoInput}
            />
            <DeviceSelector
              label="Speaker"
              value={selectedAudioOutputDeviceId || '__default__'}
              placeholder="Default speaker"
              defaultLabel="Default speaker"
              devices={audioOutputDevices}
              onValueChange={onSelectAudioOutput}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participants ({participants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {participants.length ? (
                participants.map((participant) => {
                  const label = userLabelById.get(participant.userId) ?? 'Unknown participant';
                  return (
                    <div
                      key={participant.userId}
                      className={`rounded-md border p-2 ${activeSpeakerUserIds.includes(participant.userId) ? 'border-primary/60 bg-primary/5' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{label}</p>
                        <div className="flex gap-1">
                          {activeSpeakerUserIds.includes(participant.userId) ? (
                            <Badge variant="default" className="gap-1">
                              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                              Speaking
                            </Badge>
                          ) : null}
                          <Badge variant={participant.isMuted ? 'outline' : 'default'}>
                            {participant.isMuted ? 'Muted' : 'Mic'}
                          </Badge>
                          <Badge variant={participant.isVideoOff ? 'outline' : 'default'}>
                            {participant.isVideoOff ? 'No Cam' : 'Cam'}
                          </Badge>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Joined {formatDateTime(participant.joinedAt)}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No participants in room yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type DeviceSelectorProps = {
  label: string;
  value: string;
  placeholder: string;
  defaultLabel: string;
  devices: MediaDeviceInfo[];
  onValueChange: (value: string) => void;
};

function DeviceSelector({
  label,
  value,
  placeholder,
  defaultLabel,
  devices,
  onValueChange,
}: DeviceSelectorProps) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__default__">{defaultLabel}</SelectItem>
          {devices.map((device) => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              {device.label || `${label} ${device.deviceId.slice(0, 6)}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
