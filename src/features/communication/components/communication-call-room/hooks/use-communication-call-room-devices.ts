import { useEffect, useState } from 'react';
import { Room } from 'livekit-client';
import { toast } from 'sonner';
import {
  AUDIO_INPUT_STORAGE_KEY,
  AUDIO_OUTPUT_STORAGE_KEY,
  VIDEO_INPUT_STORAGE_KEY,
  readStoredDeviceId,
  writeStoredDeviceId,
} from '../utils/communication-call-room-utils';

export function useCommunicationCallRoomDevices(roomRef: React.RefObject<Room | null>) {
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioInputDeviceId, setSelectedAudioInputDeviceId] = useState(() =>
    readStoredDeviceId(AUDIO_INPUT_STORAGE_KEY),
  );
  const [selectedVideoInputDeviceId, setSelectedVideoInputDeviceId] = useState(() =>
    readStoredDeviceId(VIDEO_INPUT_STORAGE_KEY),
  );
  const [selectedAudioOutputDeviceId, setSelectedAudioOutputDeviceId] = useState(() =>
    readStoredDeviceId(AUDIO_OUTPUT_STORAGE_KEY),
  );

  const refreshDevices = async () => {
    try {
      const [audioInputs, videoInputs, audioOutputs] = await Promise.all([
        Room.getLocalDevices('audioinput'),
        Room.getLocalDevices('videoinput'),
        Room.getLocalDevices('audiooutput'),
      ]);
      setAudioInputDevices(audioInputs);
      setVideoInputDevices(videoInputs);
      setAudioOutputDevices(audioOutputs);

      if (!selectedAudioInputDeviceId && audioInputs[0]?.deviceId) {
        setSelectedAudioInputDeviceId(audioInputs[0].deviceId);
      }
      if (!selectedVideoInputDeviceId && videoInputs[0]?.deviceId) {
        setSelectedVideoInputDeviceId(videoInputs[0].deviceId);
      }
      if (!selectedAudioOutputDeviceId && audioOutputs[0]?.deviceId) {
        setSelectedAudioOutputDeviceId(audioOutputs[0].deviceId);
      }
    } catch {
      return;
    }
  };

  useEffect(() => {
    void refreshDevices();
  }, []);

  const onSelectAudioInput = async (value: string) => {
    const next = value === '__default__' ? '' : value;
    setSelectedAudioInputDeviceId(next);
    writeStoredDeviceId(AUDIO_INPUT_STORAGE_KEY, next);
    if (!roomRef.current || !next) return;
    try {
      await roomRef.current.switchActiveDevice('audioinput', next);
    } catch {
      toast.error('Unable to switch microphone device.');
    }
  };

  const onSelectVideoInput = async (value: string) => {
    const next = value === '__default__' ? '' : value;
    setSelectedVideoInputDeviceId(next);
    writeStoredDeviceId(VIDEO_INPUT_STORAGE_KEY, next);
    if (!roomRef.current || !next) return;
    try {
      await roomRef.current.switchActiveDevice('videoinput', next);
    } catch {
      toast.error('Unable to switch camera device.');
    }
  };

  const onSelectAudioOutput = async (value: string) => {
    const next = value === '__default__' ? '' : value;
    setSelectedAudioOutputDeviceId(next);
    writeStoredDeviceId(AUDIO_OUTPUT_STORAGE_KEY, next);
    if (!roomRef.current || !next) return;
    try {
      await roomRef.current.switchActiveDevice('audiooutput', next);
    } catch {
      toast.error('This browser does not support selecting output devices.');
    }
  };

  return {
    audioInputDevices,
    videoInputDevices,
    audioOutputDevices,
    selectedAudioInputDeviceId,
    selectedVideoInputDeviceId,
    selectedAudioOutputDeviceId,
    refreshDevices,
    onSelectAudioInput,
    onSelectVideoInput,
    onSelectAudioOutput,
  };
}
