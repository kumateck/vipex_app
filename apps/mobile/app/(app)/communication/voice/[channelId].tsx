import '@mobile/lib/polyfills';
import { AppScreen } from '@mobile/components/screen';
import { VoiceChannelStage } from '@mobile/features/communication/components/voice/voice-channel-stage';
import { useVoiceChannel } from '@mobile/features/communication/hooks/use-voice-channel';

export default function MobileVoiceChannelScreen() {
  const voice = useVoiceChannel();

  return (
    <AppScreen scrollable={false}>
      <VoiceChannelStage
        loading={voice.loading}
        connected={voice.connected}
        joining={voice.joining}
        isSocketConnected={voice.isSocketConnected}
        isMuted={voice.isMuted}
        isVideoOff={voice.isVideoOff}
        speakerOn={voice.speakerOn}
        prejoinChecked={voice.prejoinChecked}
        connectionQuality={voice.connectionQuality}
        audioRouteLabel={voice.audioRouteLabel}
        channelName={voice.channelName}
        videoTrackByUserId={voice.videoTrackByUserId}
        orderedParticipants={voice.orderedParticipants}
        currentUserId={voice.session.user?.sub ?? null}
        currentUserName={voice.session.user?.fullname ?? voice.session.user?.email ?? null}
        onRefresh={() => {}}
        onJoin={() => void voice.onJoin()}
        onLeave={() => void voice.onLeave()}
        onToggleMute={() => void voice.toggleMute()}
        onToggleCamera={() => void voice.toggleCamera()}
        onToggleSpeaker={() => void voice.toggleSpeaker()}
        onRunPrejoinCheck={() => void voice.runPrejoinCheck()}
      />
    </AppScreen>
  );
}
