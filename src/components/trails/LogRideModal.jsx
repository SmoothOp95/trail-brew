/**
 * LogRideModal — three-step ride logging flow.
 *
 * Step 1: Upload a GPS screenshot (or skip to manual entry)
 * Step 2: Review / edit AI-extracted ride data
 * Step 3: Add a personal note and confirm the log
 *
 * Can also be opened in "history" mode to list past rides for a trail.
 *
 * Props:
 *   trail        {object}   — trail object from src/data/trails.js
 *   onClose      {function} — called when the modal should close
 *   onRideLogged {function} — called with no args after a successful log
 */

import { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  Mountain,
  Ruler,
  Calendar,
  FileText,
} from 'lucide-react';
import { useRideLog } from '../../hooks/useRideLog';
import { todayISO } from '../../utils/formatters';

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const NOTE_MAX_CHARS = 500;

const INPUT_CLASS =
  'w-full bg-brew-bg border border-brew-border rounded-lg px-3 py-2.5 text-brew-text placeholder:text-brew-text-muted text-sm focus:outline-none focus:border-brew-accent transition-colors';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatMinutes(mins) {
  if (mins == null) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatKm(km) {
  if (km == null) return '—';
  return `${km} km`;
}

function formatElev(m) {
  if (m == null) return '—';
  return `${m} m`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ── Confidence badge ───────────────────────────────────────────────────────

function ConfidenceBadge({ level }) {
  if (level === 'high') return null; // no badge for high confidence
  const label = level === 'low' ? 'Verify' : 'Check';
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wide text-trail-technical ml-1.5">
      <AlertTriangle size={9} />
      {label}
    </span>
  );
}

// ── Stat row (review step) ─────────────────────────────────────────────────

function StatRow({ icon: Icon, label, value, confidence, children }) {
  const isLow = confidence === 'low';
  const isMedium = confidence === 'medium';
  const highlight = isLow || isMedium;

  return (
    <div
      className={`flex items-start gap-3 py-3 border-b border-brew-border last:border-0 ${
        highlight ? 'bg-trail-technical/5 -mx-4 px-4 rounded-lg' : ''
      }`}
    >
      <div className="mt-0.5 text-brew-text-muted shrink-0">
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1">
          <span className="font-mono text-[10px] text-brew-text-muted uppercase tracking-widest">
            {label}
          </span>
          {confidence && <ConfidenceBadge level={confidence} />}
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Past ride card ─────────────────────────────────────────────────────────

function RideHistoryCard({ ride }) {
  return (
    <div className="bg-brew-bg border border-brew-border rounded-lg px-4 py-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-brew-text">
          {ride.date ? formatDate(ride.date) : '—'}
        </span>
        <span
          className={`font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${
            ride.verificationMethod === 'screenshot_ai'
              ? 'bg-brew-accent/10 text-brew-accent'
              : 'bg-brew-border text-brew-text-muted'
          }`}
        >
          {ride.verificationMethod === 'screenshot_ai' ? 'AI Verified' : 'Self Report'}
        </span>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-brew-text-dim font-mono">
        {ride.distanceKm != null && <span>{ride.distanceKm} km</span>}
        {ride.durationMinutes != null && <span>{formatMinutes(ride.durationMinutes)}</span>}
        {ride.elevationM != null && <span>↑{ride.elevationM} m</span>}
      </div>
      {ride.note && (
        <p className="text-xs text-brew-text-muted leading-relaxed pt-1 line-clamp-2">
          {ride.note}
        </p>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function LogRideModal({ trail, initialMode = 'log', onClose, onRideLogged }) {
  const { extractFromScreenshot, logRide, getTrailRides, extracting, submitting } =
    useRideLog();

  // Modal mode: 'log' starts the logging flow, 'history' shows past rides
  const [mode, setMode] = useState(initialMode);

  // Step within log mode: 'upload' | 'review' | 'note'
  const [step, setStep] = useState('upload');

  // File state
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileError, setFileError] = useState(null);

  // OCR progress (0–100)
  const [ocrProgress, setOcrProgress] = useState(0);

  // Extraction result from OCR
  const [extraction, setExtraction] = useState(null);
  const [extractError, setExtractError] = useState(null);

  // Editable fields (pre-filled from extraction or blank for self-report)
  const [date, setDate] = useState(todayISO());
  const [distanceKm, setDistanceKm] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [elevationM, setElevationM] = useState('');

  // Note and confirmation state
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // History state
  const [pastRides, setPastRides] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fileInputRef = useRef(null);

  // Self-report mode flag (set when user skips the upload step)
  const [isSelfReport, setIsSelfReport] = useState(false);

  // Load ride history when switching to history mode
  useEffect(() => {
    if (mode === 'history') {
      setHistoryLoading(true);
      getTrailRides(trail.id)
        .then(setPastRides)
        .catch(() => setPastRides([]))
        .finally(() => setHistoryLoading(false));
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── File selection ───────────────────────────────────────────────────────

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFileError(null);

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setFileError('Please select a JPG, PNG, or WebP image.');
      return;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setFileError('Image must be under 10 MB.');
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  // ── Extract from screenshot ──────────────────────────────────────────────

  const handleExtract = async () => {
    if (!file) return;

    setExtractError(null);
    setOcrProgress(0);

    try {
      const result = await extractFromScreenshot(file, setOcrProgress);

      const allNull =
        result.distanceKm == null &&
        result.durationMinutes == null &&
        result.elevationM == null &&
        result.date == null;

      if (allNull) {
        setExtractError(
          "We couldn't read that screenshot. Try a clearer image or log manually instead."
        );
        setOcrProgress(0);
        return;
      }

      setExtraction(result);
      setDate(result.date || todayISO());
      setDistanceKm(result.distanceKm != null ? String(result.distanceKm) : '');
      setDurationMinutes(result.durationMinutes != null ? String(result.durationMinutes) : '');
      setElevationM(result.elevationM != null ? String(result.elevationM) : '');
      setStep('review');
    } catch {
      setExtractError(
        "We couldn't read that screenshot. Try a clearer image or log manually instead."
      );
      setOcrProgress(0);
    }
  };

  // ── Skip to self-report ──────────────────────────────────────────────────

  const handleSkip = () => {
    setIsSelfReport(true);
    setExtraction(null);
    setDate(todayISO());
    setDistanceKm('');
    setDurationMinutes('');
    setElevationM('');
    setStep('note');
  };

  // ── Confirm review, go to note step ─────────────────────────────────────

  const handleReviewConfirm = () => {
    setStep('note');
  };

  // ── Submit ride ──────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitError(null);

    try {
      await logRide({
        trailId: trail.id,
        trailName: trail.name,
        date,
        distanceKm: distanceKm !== '' ? Number(distanceKm) : null,
        durationMinutes: durationMinutes !== '' ? Number(durationMinutes) : null,
        elevationM: elevationM !== '' ? Number(elevationM) : null,
        note,
        verificationMethod: isSelfReport ? 'self_report' : 'screenshot_ai',
        screenshotFile: file,
        aiRawExtraction: extraction ?? null,
        aiConfidence: extraction?.confidence ?? null,
      });

      setSuccess(true);

      // Brief success display, then close
      setTimeout(() => {
        onRideLogged?.();
        onClose();
      }, 1400);
    } catch (err) {
      setSubmitError(err?.message || 'Failed to save ride. Please try again.');
    }
  };

  // ── Backdrop click to close ──────────────────────────────────────────────

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const stepLabel =
    mode === 'history'
      ? 'Ride History'
      : step === 'upload'
      ? 'Log a Ride'
      : step === 'review'
      ? 'Review Activity'
      : 'Add a Note';

  return (
    <div
      className="fixed inset-0 bg-brew-bg/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-brew-card border border-brew-border rounded-xl w-full max-w-sm max-h-[90vh] flex flex-col">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-brew-border shrink-0">
          <div>
            <h2 className="font-bold text-brew-text text-base">{stepLabel}</h2>
            <p className="text-xs text-brew-text-muted mt-0.5 truncate max-w-[240px]">
              {trail.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-brew-text-muted hover:text-brew-text transition-colors mt-0.5 shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Tab bar (log / history) ────────────────────────────────── */}
        <div className="flex border-b border-brew-border shrink-0">
          {['log', 'history'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 font-mono text-[11px] uppercase tracking-widest font-bold transition-colors ${
                mode === m
                  ? 'text-brew-accent border-b-2 border-brew-accent'
                  : 'text-brew-text-muted hover:text-brew-text'
              }`}
            >
              {m === 'log' ? 'Log Ride' : 'History'}
            </button>
          ))}
        </div>

        {/* ── Scrollable body ────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-5 py-4">

          {/* ──────────────── HISTORY MODE ─────────────────────────── */}
          {mode === 'history' && (
            <>
              {historyLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-brew-accent" />
                </div>
              )}
              {!historyLoading && pastRides.length === 0 && (
                <p className="text-sm text-brew-text-muted text-center py-8">
                  No rides logged yet for this trail.
                </p>
              )}
              {!historyLoading && pastRides.length > 0 && (
                <div className="space-y-2">
                  {pastRides.map((ride) => (
                    <RideHistoryCard key={ride.id} ride={ride} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ──────────────── LOG MODE ─────────────────────────────── */}
          {mode === 'log' && (
            <>
              {/* ── Step 1: Upload ──────────────────────────────────── */}
              {step === 'upload' && !success && (
                <div className="space-y-4">
                  <p className="text-xs text-brew-text-muted leading-relaxed">
                    Upload a screenshot from Strava, Garmin, Wahoo, or any GPS app.
                    We'll read the activity details for you.
                  </p>

                  {/* File drop zone */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full border-2 border-dashed rounded-xl py-8 flex flex-col items-center gap-3 transition-colors ${
                      previewUrl
                        ? 'border-brew-accent/40'
                        : 'border-brew-border hover:border-brew-accent/30'
                    }`}
                    style={{ minHeight: '120px' }}
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Screenshot preview"
                        className="max-h-40 rounded-lg object-contain"
                      />
                    ) : (
                      <>
                        <Upload size={24} className="text-brew-text-muted" />
                        <span className="text-sm text-brew-text-muted">
                          Tap to select a screenshot
                        </span>
                        <span className="font-mono text-[10px] text-brew-text-muted uppercase tracking-widest">
                          JPG · PNG · WebP · max 10 MB
                        </span>
                      </>
                    )}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handleFileChange}
                    aria-label="Select screenshot"
                  />

                  {fileError && (
                    <p className="text-xs text-trail-enduro flex items-center gap-1.5">
                      <AlertTriangle size={12} />
                      {fileError}
                    </p>
                  )}

                  {extractError && (
                    <p className="text-xs text-trail-enduro flex items-center gap-1.5">
                      <AlertTriangle size={12} />
                      {extractError}
                    </p>
                  )}

                  {/* Read activity button */}
                  <button
                    onClick={handleExtract}
                    disabled={!file || extracting}
                    className="w-full bg-brew-accent text-brew-bg font-bold text-sm rounded-lg py-3 hover:bg-[#D4F27A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ minHeight: '44px' }}
                  >
                    {extracting && <Loader2 size={14} className="animate-spin" />}
                    {extracting
                      ? ocrProgress > 0
                        ? `Reading… ${ocrProgress}%`
                        : 'Loading reader…'
                      : 'Read activity'}
                  </button>

                  {/* Skip link */}
                  <button
                    onClick={handleSkip}
                    className="w-full text-center text-xs text-brew-text-muted hover:text-brew-text transition-colors py-2"
                  >
                    Skip — log manually instead
                  </button>
                </div>
              )}

              {/* ── Step 2: Review extraction ───────────────────────── */}
              {step === 'review' && extraction && !success && (
                <div className="space-y-1">
                  {/* Source app label */}
                  {extraction.sourceApp && (
                    <p className="font-mono text-[10px] text-brew-text-muted uppercase tracking-widest mb-3">
                      Detected: {extraction.sourceApp}
                    </p>
                  )}

                  {/* Extraction notes from Claude */}
                  {extraction.notes && (
                    <p className="text-xs text-brew-text-muted bg-brew-bg rounded-lg px-3 py-2 mb-3 leading-relaxed">
                      {extraction.notes}
                    </p>
                  )}

                  {/* Date */}
                  <StatRow
                    icon={Calendar}
                    label="Date"
                    confidence={extraction.confidence?.date}
                  >
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={`${INPUT_CLASS} font-mono text-xs`}
                    />
                  </StatRow>

                  {/* Distance */}
                  <StatRow
                    icon={Ruler}
                    label="Distance (km)"
                    confidence={extraction.confidence?.distanceKm}
                  >
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g. 28.4"
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(e.target.value)}
                      className={`${INPUT_CLASS} font-mono text-xs`}
                    />
                  </StatRow>

                  {/* Duration */}
                  <StatRow
                    icon={Clock}
                    label="Duration (minutes total)"
                    confidence={extraction.confidence?.durationMinutes}
                  >
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 112"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      className={`${INPUT_CLASS} font-mono text-xs`}
                    />
                    {durationMinutes !== '' && (
                      <p className="font-mono text-[10px] text-brew-text-muted mt-1">
                        = {formatMinutes(Number(durationMinutes))}
                      </p>
                    )}
                  </StatRow>

                  {/* Elevation */}
                  <StatRow
                    icon={Mountain}
                    label="Elevation gain (m)"
                    confidence={extraction.confidence?.elevationM}
                  >
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 650"
                      value={elevationM}
                      onChange={(e) => setElevationM(e.target.value)}
                      className={`${INPUT_CLASS} font-mono text-xs`}
                    />
                  </StatRow>

                  <button
                    onClick={handleReviewConfirm}
                    className="w-full mt-4 bg-brew-accent text-brew-bg font-bold text-sm rounded-lg py-3 hover:bg-[#D4F27A] transition-colors flex items-center justify-center gap-2"
                    style={{ minHeight: '44px' }}
                  >
                    Confirm ride
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* ── Step 3: Note + confirm ──────────────────────────── */}
              {step === 'note' && !success && (
                <div className="space-y-4">
                  {/* Stats summary (read-only if from screenshot flow) */}
                  {!isSelfReport && (
                    <div className="bg-brew-bg rounded-lg px-4 py-3 space-y-1.5">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-brew-text-dim">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={10} />
                          {formatDate(date)}
                        </span>
                        {distanceKm !== '' && (
                          <span className="flex items-center gap-1.5">
                            <Ruler size={10} />
                            {formatKm(Number(distanceKm))}
                          </span>
                        )}
                        {durationMinutes !== '' && (
                          <span className="flex items-center gap-1.5">
                            <Clock size={10} />
                            {formatMinutes(Number(durationMinutes))}
                          </span>
                        )}
                        {elevationM !== '' && (
                          <span className="flex items-center gap-1.5">
                            <Mountain size={10} />
                            ↑{formatElev(Number(elevationM))}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Self-report manual entry fields */}
                  {isSelfReport && (
                    <div className="space-y-3">
                      <div>
                        <label className="block font-mono text-[10px] text-brew-text-muted uppercase tracking-widest mb-1.5">
                          Date
                        </label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className={`${INPUT_CLASS} font-mono text-sm`}
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-brew-text-muted uppercase tracking-widest mb-1.5">
                          Distance (km) — optional
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g. 28.4"
                          value={distanceKm}
                          onChange={(e) => setDistanceKm(e.target.value)}
                          className={`${INPUT_CLASS} font-mono text-sm`}
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-brew-text-muted uppercase tracking-widest mb-1.5">
                          Duration (total minutes) — optional
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 112"
                          value={durationMinutes}
                          onChange={(e) => setDurationMinutes(e.target.value)}
                          className={`${INPUT_CLASS} font-mono text-sm`}
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-brew-text-muted uppercase tracking-widest mb-1.5">
                          Elevation gain (m) — optional
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 650"
                          value={elevationM}
                          onChange={(e) => setElevationM(e.target.value)}
                          className={`${INPUT_CLASS} font-mono text-sm`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Note input */}
                  <div>
                    <label className="block font-mono text-[10px] text-brew-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <FileText size={10} />
                      Note — optional
                    </label>
                    <textarea
                      rows={3}
                      maxLength={NOTE_MAX_CHARS}
                      placeholder="How did it go? Trail conditions, what worked, what didn't…"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className={`${INPUT_CLASS} resize-none leading-relaxed`}
                    />
                    <p className="font-mono text-[10px] text-brew-text-muted mt-1 text-right">
                      {note.length}/{NOTE_MAX_CHARS}
                    </p>
                  </div>

                  {submitError && (
                    <p className="text-xs text-trail-enduro flex items-center gap-1.5">
                      <AlertTriangle size={12} />
                      {submitError}
                    </p>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !date}
                    className="w-full bg-brew-accent text-brew-bg font-bold text-sm rounded-lg py-3 hover:bg-[#D4F27A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ minHeight: '44px' }}
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    {submitting ? 'Saving…' : 'Log ride'}
                  </button>
                </div>
              )}

              {/* ── Success state ───────────────────────────────────── */}
              {success && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <CheckCircle size={36} className="text-brew-accent" />
                  <p className="font-bold text-brew-text">Ride logged</p>
                  <p className="text-xs text-brew-text-muted">Updating your dashboard…</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
