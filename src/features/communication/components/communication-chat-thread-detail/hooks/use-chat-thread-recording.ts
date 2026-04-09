import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { buildRecordedUpload } from '../services/build-recorded-upload';
import { pickSupportedRecorderMimeType } from '../utils/communication-chat-thread-detail-media';
import type {
  PendingFileUpload,
  RecordingMode,
} from '../types/communication-chat-thread-detail.types';

type UseChatThreadRecordingParams = {
  onRecorded: (pendingUpload: PendingFileUpload) => void;
};

export function useChatThreadRecording({ onRecorded }: UseChatThreadRecordingParams) {
  const [isRecorderDialogOpen, setIsRecorderDialogOpen] = useState(false);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('audio');
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparingRecording, setIsPreparingRecording] = useState(false);
  const [recordingElapsedSec, setRecordingElapsedSec] = useState(0);

  const recorderPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderChunksRef = useRef<Blob[]>([]);
  const shouldKeepRecordingResultRef = useRef(true);
  const recordingStartedAtRef = useRef<number | null>(null);
  const recordingTickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRecordingStream = () => {
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }
    if (recorderPreviewRef.current) {
      recorderPreviewRef.current.srcObject = null;
    }
  };

  const closeRecorderDialog = (discardRecording = true) => {
    if (recordingTickTimerRef.current) {
      clearInterval(recordingTickTimerRef.current);
      recordingTickTimerRef.current = null;
    }
    recordingStartedAtRef.current = null;
    setRecordingElapsedSec(0);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      shouldKeepRecordingResultRef.current = !discardRecording;
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    mediaRecorderChunksRef.current = [];
    setIsRecording(false);
    setIsPreparingRecording(false);
    setIsRecorderDialogOpen(false);
    stopRecordingStream();
  };

  const onRecordMedia = async (mode: RecordingMode) => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast.error('Recording is not supported in this browser.');
      return;
    }
    if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
      toast.error('Media recording is not supported in this browser.');
      return;
    }

    try {
      setRecordingMode(mode);
      setIsRecorderDialogOpen(true);
      setIsPreparingRecording(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === 'video',
      });
      mediaStreamRef.current = stream;

      const mimeType = pickSupportedRecorderMimeType(mode) ?? undefined;
      const recorder = new window.MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      mediaRecorderChunksRef.current = [];
      shouldKeepRecordingResultRef.current = true;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mediaRecorderChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        toast.error('Recording failed. Please try again.');
        closeRecorderDialog();
      };

      recorder.onstop = () => {
        void (async () => {
          try {
            if (!shouldKeepRecordingResultRef.current) {
              closeRecorderDialog(false);
              return;
            }

            const chunks = mediaRecorderChunksRef.current;
            mediaRecorderChunksRef.current = [];
            if (!chunks.length) {
              closeRecorderDialog(false);
              return;
            }

            const pending = await buildRecordedUpload({
              mode,
              mimeType,
              chunks,
              recordingStartedAt: recordingStartedAtRef.current,
            });

            onRecorded(pending);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to process recording.');
          } finally {
            closeRecorderDialog(false);
          }
        })();
      };

      if (recorderPreviewRef.current) {
        recorderPreviewRef.current.srcObject = stream;
        if (mode === 'video') {
          void recorderPreviewRef.current.play().catch(() => null);
        }
      }

      recorder.start();
      recordingStartedAtRef.current = Date.now();
      setRecordingElapsedSec(0);
      if (recordingTickTimerRef.current) clearInterval(recordingTickTimerRef.current);
      recordingTickTimerRef.current = setInterval(() => {
        const startedAt = recordingStartedAtRef.current;
        if (!startedAt) return;
        setRecordingElapsedSec(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
      }, 250);
      setIsRecording(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to start recording.');
      closeRecorderDialog();
    } finally {
      setIsPreparingRecording(false);
    }
  };

  const onStopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    shouldKeepRecordingResultRef.current = true;
    recorder.stop();
    setIsRecording(false);
    stopRecordingStream();
  };

  return {
    isRecorderDialogOpen,
    setIsRecorderDialogOpen,
    recordingMode,
    isRecording,
    isPreparingRecording,
    recordingElapsedSec,
    recorderPreviewRef,
    closeRecorderDialog,
    onRecordMedia,
    onStopRecording,
  };
}
