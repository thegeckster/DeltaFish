import { useState, useRef, useCallback } from 'react';
import { Mic, Square, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { transcribeAudio, parseTranscript } from '../lib/voice';
import { getSettings } from '../lib/storage';
import type { TripFormData } from '../types';

interface VoiceRecorderProps {
  onParsed: (data: Partial<TripFormData>, transcript: string) => void;
  onCancel: () => void;
}

type RecordingState = 'idle' | 'recording' | 'transcribing' | 'parsing' | 'done' | 'error';

export default function VoiceRecorder({ onParsed, onCancel }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const settings = getSettings();
  const hasApiKey = !!settings.openai_api_key;

  const startRecording = useCallback(async () => {
    try {
      chunksRef.current = [];
      setElapsed(0);
      setError('');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Detect supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);

        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        await processAudio(audioBlob);
      };

      mediaRecorder.start(1000); // Collect data every second
      setState('recording');

      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          if (prev >= 300) { // 5 minute max
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Could not access microphone. Check browser permissions.');
      setState('error');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Step 1: Transcribe
      setState('transcribing');
      const text = await transcribeAudio(audioBlob);
      setTranscript(text);

      // Step 2: Parse
      setState('parsing');
      const parsed = await parseTranscript(text);

      setState('done');
      // Short delay so user sees the success state
      setTimeout(() => onParsed(parsed, text), 800);
    } catch (err: any) {
      setError(err.message || 'Processing failed');
      setState('error');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!hasApiKey) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">API Key Required</h3>
          <p className="text-sm text-slate-600 mb-4">
            Voice logging requires an OpenAI API key. Add yours in Settings to get started.
          </p>
          <button
            onClick={onCancel}
            className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center p-6">
      {/* Close button */}
      <button
        onClick={() => {
          if (state === 'recording') stopRecording();
          if (timerRef.current) clearInterval(timerRef.current);
          onCancel();
        }}
        className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
      >
        Cancel
      </button>

      {/* Idle state */}
      {state === 'idle' && (
        <>
          <p className="text-slate-300 text-center mb-8 max-w-xs">
            Tap the mic and describe your trip. Talk naturally — mention the date, where you launched,
            water conditions, what you threw, and what you caught.
          </p>
          <button
            onClick={startRecording}
            className="w-24 h-24 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors shadow-lg shadow-blue-600/30"
          >
            <Mic className="w-10 h-10 text-white" />
          </button>
          <p className="text-slate-500 text-sm mt-4">Tap to start recording</p>
        </>
      )}

      {/* Recording state */}
      {state === 'recording' && (
        <>
          <div className="mb-8 text-center">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mx-auto mb-2" />
            <p className="text-white text-lg font-medium">Recording</p>
            <p className="text-slate-400 text-2xl font-mono mt-1">{formatTime(elapsed)}</p>
            <p className="text-slate-500 text-xs mt-1">Max 5 minutes</p>
          </div>
          <button
            onClick={stopRecording}
            className="w-24 h-24 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg shadow-red-600/30"
          >
            <Square className="w-8 h-8 text-white fill-white" />
          </button>
          <p className="text-slate-500 text-sm mt-4">Tap to stop</p>
        </>
      )}

      {/* Processing states */}
      {(state === 'transcribing' || state === 'parsing') && (
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-medium">
            {state === 'transcribing' ? 'Transcribing...' : 'Parsing trip data...'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {state === 'transcribing'
              ? 'Converting speech to text'
              : 'Extracting structured fields from transcript'}
          </p>
          {transcript && (
            <div className="mt-6 max-w-sm mx-auto p-3 bg-slate-800 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Transcript:</p>
              <p className="text-sm text-slate-300 text-left">{transcript}</p>
            </div>
          )}
        </div>
      )}

      {/* Done state */}
      {state === 'done' && (
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Got it!</p>
          <p className="text-slate-400 text-sm mt-1">Loading your trip data...</p>
        </div>
      )}

      {/* Error state */}
      {state === 'error' && (
        <div className="text-center max-w-sm">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-white text-lg font-medium mb-2">Something went wrong</p>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => { setState('idle'); setError(''); }}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium"
            >
              Try Again
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 bg-slate-700 text-slate-300 rounded-lg font-medium"
            >
              Enter Manually
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
