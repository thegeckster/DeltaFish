import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TripFormData, emptyTripForm } from '../types';
import { saveTrip, saveConditions } from '../lib/storage';
import { enrichTrip } from '../lib/enrichment';
import StepIndicator from '../components/ui/StepIndicator';
import StepBasics from '../components/trip-form/StepBasics';
import StepWaterConditions from '../components/trip-form/StepWaterConditions';
import StepFishingDetails from '../components/trip-form/StepFishingDetails';
import StepCatches from '../components/trip-form/StepCatches';
import StepTournament from '../components/trip-form/StepTournament';
import StepObservations from '../components/trip-form/StepObservations';
import StepReview from '../components/trip-form/StepReview';
import VoiceRecorder from '../components/VoiceRecorder';
import { Loader2, CheckCircle, Mic } from 'lucide-react';

const STEPS = ['Basics', 'Water', 'Fishing', 'Catches', 'Tournament', 'Notes', 'Review'];

export default function LogTrip() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<TripFormData>(emptyTripForm());
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tripCount, setTripCount] = useState(0);
  const [showVoice, setShowVoice] = useState(!!(location.state as any)?.voice);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const updateForm = (updates: Partial<TripFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleVoiceParsed = (data: Partial<TripFormData>, transcript: string) => {
    setFormData(prev => {
      const merged = { ...prev };
      // Only overwrite fields that have actual data from voice
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined && value !== '' &&
            !(Array.isArray(value) && value.length === 0)) {
          (merged as any)[key] = value;
        }
      }
      return merged;
    });
    setVoiceTranscript(transcript);
    setShowVoice(false);
    // Jump to review step so user can verify parsed data
    setStep(STEPS.length - 1);
  };

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!formData.date_fished) errors.date_fished = 'Date is required';
    if (!formData.launch_location || formData.launch_location === '__custom') errors.launch_location = 'Launch location is required';
    if (!formData.start_time) errors.start_time = 'Start time is required';
    if (!formData.end_time) errors.end_time = 'End time is required';
    if (!formData.water_temp_f) errors.water_temp_f = 'Water temperature is required';
    if (!formData.water_clarity_inches) errors.water_clarity_inches = 'Water clarity is required';
    if (formData.vegetation_types.length === 0) errors.vegetation_types = 'Select at least one vegetation type';
    if (!formData.vegetation_density) errors.vegetation_density = 'Vegetation density is required';
    if (formData.areas_fished.length === 0) errors.areas_fished = 'Select at least one area';
    if (formData.lures_used.length === 0) errors.lures_used = 'Select at least one lure';
    return errors;
  };

  const errors = step === STEPS.length - 1 ? validate() : {};
  const canSave = Object.keys(errors).length === 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);

    try {
      const tripId = saveTrip(formData);

      const trips = JSON.parse(localStorage.getItem('deltafish_trips') || '[]');
      setTripCount(trips.length);

      setEnriching(true);
      try {
        const conditions = await enrichTrip(
          formData.date_fished,
          formData.start_time,
          formData.end_time,
          parseFloat(formData.water_temp_f)
        );
        saveConditions(tripId, conditions);
      } catch (e) {
        console.warn('Enrichment failed:', e);
      }
      setEnriching(false);
      setSaved(true);

      setTimeout(() => navigate(`/trips/${tripId}`), 1500);
    } catch (e) {
      console.error('Save failed:', e);
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Trip #{tripCount} Saved!</h2>
        <p className="text-slate-500 mt-1">Redirecting to trip details...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Voice Recorder Overlay */}
      {showVoice && (
        <VoiceRecorder
          onParsed={handleVoiceParsed}
          onCancel={() => setShowVoice(false)}
        />
      )}

      {/* Voice button */}
      {!showVoice && step === 0 && (
        <button
          onClick={() => setShowVoice(true)}
          className="w-full mb-4 py-3 bg-white border-2 border-blue-200 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <Mic className="w-5 h-5" />
          Voice Log Trip
        </button>
      )}

      {/* Transcript banner */}
      {voiceTranscript && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-600 font-medium mb-1">Voice transcript:</p>
          <p className="text-sm text-slate-700">{voiceTranscript}</p>
          <p className="text-xs text-blue-500 mt-1">Review the parsed data below. Edit any step if needed, then save.</p>
        </div>
      )}

      <StepIndicator steps={STEPS} currentStep={step} />

      <div className="min-h-[300px]">
        {step === 0 && <StepBasics data={formData} onChange={updateForm} errors={errors} />}
        {step === 1 && <StepWaterConditions data={formData} onChange={updateForm} errors={errors} />}
        {step === 2 && <StepFishingDetails data={formData} onChange={updateForm} errors={errors} />}
        {step === 3 && <StepCatches data={formData} onChange={updateForm} errors={errors} />}
        {step === 4 && <StepTournament data={formData} onChange={updateForm} />}
        {step === 5 && <StepObservations data={formData} onChange={updateForm} />}
        {step === 6 && <StepReview data={formData} errors={errors} />}
      </div>

      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              canSave && !saving
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {enriching ? 'Enriching conditions...' : saving ? 'Saving...' : 'Save Trip'}
          </button>
        )}
      </div>
    </div>
  );
}
