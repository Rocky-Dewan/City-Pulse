import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';
import axios from 'axios';
import toast from 'react-hot-toast';

const API        = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const CATEGORIES = [
  { value: 'pothole',     label: 'Pothole',       icon: '🕳️', desc: 'Road damage, cracks, holes' },
  { value: 'streetlight', label: 'Streetlight',   icon: '💡', desc: 'Broken or missing lights' },
  { value: 'flooding',    label: 'Flooding',       icon: '🌊', desc: 'Water accumulation, drainage' },
  { value: 'garbage',     label: 'Garbage',        icon: '🗑️', desc: 'Illegal dumping, overflow' },
  { value: 'vandalism',   label: 'Vandalism',      icon: '🔨', desc: 'Graffiti, property damage' },
  { value: 'other',       label: 'Other Issue',    icon: '📌', desc: 'Anything not listed above' },
];

// ─────────────────────────────────────────────────────────────────────────────
// TASK 2: Geo-location toggle — mutually exclusive Auto (GPS) vs Manual (text).
// Selecting one always clears + disables the other.
// Manual mode uses Nominatim (OpenStreetMap) to geocode the address for free.
// ─────────────────────────────────────────────────────────────────────────────
const LOC_AUTO   = 'auto';
const LOC_MANUAL = 'manual';

const geocodeAddress = async (address) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (data.length === 0) return null;
  return {
    lat:         parseFloat(data[0].lat),
    lon:         parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
};

const ReportIssue = () => {
  const { getToken }  = useAuth();
  const navigate      = useNavigate();

  const [form, setForm] = useState({
    title: '', description: '', category: '', imageUrl: '',
  });

  // Location state
  const [locMode,        setLocMode]        = useState(null);           // null | 'auto' | 'manual'
  const [coords,         setCoords]         = useState(null);           // { lat, lon }
  const [locStatus,      setLocStatus]      = useState('idle');         // idle|loading|success|error|geocoding
  const [manualAddress,  setManualAddress]  = useState('');
  const [geocodedPlace,  setGeocodedPlace]  = useState('');            // human-readable confirmed address

  const [submitting, setSubmitting] = useState(false);
  const [step,       setStep]       = useState(1);

  const set = (field) => (val) =>
    setForm(f => ({ ...f, [field]: typeof val === 'string' ? val : val.target?.value ?? val }));

  // ── Location mode handlers ────────────────────────────────────────────────

  const selectAutoMode = () => {
    // Clear manual state
    setManualAddress('');
    setGeocodedPlace('');
    setLocMode(LOC_AUTO);
    setCoords(null);
    setLocStatus('loading');

    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocStatus('success');
      },
      () => setLocStatus('error'),
      { timeout: 10000, enableHighAccuracy: true }
    );

    if (!navigator.geolocation) {
      setLocStatus('error');
    }
  };

  const selectManualMode = () => {
    // Clear auto GPS state
    setCoords(null);
    setLocStatus('idle');
    setLocMode(LOC_MANUAL);
  };

  const handleGeocode = async () => {
    if (!manualAddress.trim()) { toast.error('Enter an address to search.'); return; }
    setLocStatus('geocoding');
    try {
      const result = await geocodeAddress(manualAddress.trim());
      if (!result) {
        setLocStatus('error');
        toast.error('Address not found. Try a more specific query.');
        return;
      }
      setCoords({ lat: result.lat, lon: result.lon });
      setGeocodedPlace(result.displayName);
      setLocStatus('success');
      toast.success('Location confirmed!');
    } catch {
      setLocStatus('error');
      toast.error('Geocoding failed. Check your connection.');
    }
  };

  const clearLocation = () => {
    setLocMode(null);
    setCoords(null);
    setLocStatus('idle');
    setManualAddress('');
    setGeocodedPlace('');
  };

  // ── Form submit ───────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.category)              { toast.error('Please select a category.'); setStep(1); return; }
    if (!form.title.trim())          { toast.error('Please enter a title.');      return; }
    if (!form.description.trim())    { toast.error('Please add a description.'); return; }
    if (form.description.trim().length < 20) { toast.error('Description needs at least 20 characters.'); return; }
    if (!coords && locMode !== LOC_MANUAL) {
      toast.error('Location is required. Please select a location mode.'); return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      await axios.post(
        `${API}/api/reports`,
        {
          title:         form.title.trim(),
          description:   form.description.trim(),
          category:      form.category,
          image_url:     form.imageUrl || undefined,
          latitude:      coords?.lat  ?? undefined,
          longitude:     coords?.lon  ?? undefined,
          location_text: locMode === LOC_MANUAL
            ? (geocodedPlace || manualAddress.trim())
            : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Report submitted! Thank you for helping your city.', { duration: 4000 });
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit report. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const charCount = form.description.length;

  // ── Location panel UI helper ──────────────────────────────────────────────
  const renderLocationPanel = () => {
    if (locMode === null) {
      // Neither selected yet — show both options
      return (
        <div className="grid grid-cols-2 gap-3">
          {/* Auto GPS option */}
          <button
            type="button"
            onClick={selectAutoMode}
            className="flex flex-col items-center gap-2 px-4 py-5 rounded-xl border border-city-border bg-city-surface
                       hover:border-city-orange/40 hover:bg-city-orange/5 transition-all duration-200 text-center"
          >
            <span className="text-2xl">📍</span>
            <div>
              <p className="font-display text-sm font-semibold text-city-text">Use Live Location</p>
              <p className="font-body text-xs text-city-muted mt-0.5">Auto-detect via GPS</p>
            </div>
          </button>

          {/* Manual text option */}
          <button
            type="button"
            onClick={selectManualMode}
            className="flex flex-col items-center gap-2 px-4 py-5 rounded-xl border border-city-border bg-city-surface
                       hover:border-city-orange/40 hover:bg-city-orange/5 transition-all duration-200 text-center"
          >
            <span className="text-2xl">🔤</span>
            <div>
              <p className="font-display text-sm font-semibold text-city-text">Type Location</p>
              <p className="font-body text-xs text-city-muted mt-0.5">Search by address</p>
            </div>
          </button>
        </div>
      );
    }

    // Auto GPS mode
    if (locMode === LOC_AUTO) {
      return (
        <div>
          {/* Mode indicator */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-city-blue bg-city-blue/10 border border-city-blue/20 px-2.5 py-1 rounded-full">
                📍 Live GPS
              </span>
            </div>
            <button
              type="button"
              onClick={clearLocation}
              className="font-mono text-xs text-city-muted hover:text-city-subtext underline"
            >
              Switch mode
            </button>
          </div>

          {/* Status */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            locStatus === 'success' ? 'bg-city-green/5 border-city-green/30'
            : locStatus === 'error'   ? 'bg-city-red/5 border-city-red/30'
            : 'bg-city-card border-city-border'
          }`}>
            {locStatus === 'loading' && (
              <><div className="w-4 h-4 border-2 border-city-orange border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="font-body text-sm text-city-subtext">Detecting your location…</p></>
            )}
            {locStatus === 'success' && coords && (
              <><div className="w-2 h-2 rounded-full bg-city-green flex-shrink-0" />
              <div>
                <p className="font-body text-sm text-city-green font-medium">Location detected</p>
                <p className="font-mono text-xs text-city-muted">{coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}</p>
              </div></>
            )}
            {locStatus === 'error' && (
              <><div className="w-2 h-2 rounded-full bg-city-red flex-shrink-0" />
              <div>
                <p className="font-body text-sm text-city-red font-medium">GPS unavailable</p>
                <p className="font-mono text-xs text-city-muted">Permission denied or not supported.</p>
              </div>
              <button type="button" onClick={selectAutoMode} className="ml-auto btn-secondary text-xs py-1.5 px-3">
                Retry
              </button></>
            )}
          </div>
        </div>
      );
    }

    // Manual mode
    if (locMode === LOC_MANUAL) {
      return (
        <div>
          {/* Mode indicator */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs text-city-orange bg-city-orange/10 border border-city-orange/20 px-2.5 py-1 rounded-full">
              🔤 Manual Address
            </span>
            <button
              type="button"
              onClick={clearLocation}
              className="font-mono text-xs text-city-muted hover:text-city-subtext underline"
            >
              Switch mode
            </button>
          </div>

          {/* Input + geocode button */}
          {locStatus !== 'success' && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Gulshan 1, Dhaka"
                value={manualAddress}
                onChange={e => setManualAddress(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleGeocode())}
                className="input-field flex-1"
                disabled={locStatus === 'geocoding'}
              />
              <button
                type="button"
                onClick={handleGeocode}
                disabled={locStatus === 'geocoding' || !manualAddress.trim()}
                className="btn-secondary flex-shrink-0 flex items-center gap-1.5 px-4"
              >
                {locStatus === 'geocoding'
                  ? <div className="w-4 h-4 border-2 border-city-orange border-t-transparent rounded-full animate-spin" />
                  : '🔍'}
                {locStatus !== 'geocoding' && 'Find'}
              </button>
            </div>
          )}

          {/* Success state */}
          {locStatus === 'success' && coords && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-city-green/5 border border-city-green/30">
              <div className="w-2 h-2 rounded-full bg-city-green flex-shrink-0 mt-1.5" />
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-city-green font-medium">Location confirmed</p>
                <p className="font-body text-xs text-city-subtext mt-0.5 line-clamp-2">{geocodedPlace || manualAddress}</p>
                <p className="font-mono text-[11px] text-city-muted mt-1">{coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}</p>
              </div>
              <button
                type="button"
                onClick={() => { setCoords(null); setLocStatus('idle'); setGeocodedPlace(''); }}
                className="text-city-muted hover:text-city-red flex-shrink-0 text-xs"
                title="Clear"
              >
                ✕
              </button>
            </div>
          )}

          {/* Error state */}
          {locStatus === 'error' && (
            <p className="font-mono text-xs text-city-red mt-2">Address not found. Try something more specific.</p>
          )}
        </div>
      );
    }
  };

  return (
    <div className="page-container max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <div className="orange-dot" />
          <span className="font-mono text-xs text-city-orange tracking-widest uppercase">New Report</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-city-text">Report an Issue</h1>
        <p className="font-body text-sm text-city-subtext mt-1">Document the problem and help your city fix it.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8 animate-fade-in">
        {[1, 2].map((s) => (
          <React.Fragment key={s}>
            <button
              onClick={() => setStep(s)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${
                step === s
                  ? 'bg-city-orange/10 border-city-orange/40 text-city-orange'
                  : s < step
                  ? 'bg-city-green/10 border-city-green/30 text-city-green'
                  : 'bg-city-card border-city-border text-city-muted'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold
                ${step === s ? 'bg-city-orange text-white' : s < step ? 'bg-city-green text-white' : 'bg-city-border text-city-muted'}`}>
                {s < step ? '✓' : s}
              </span>
              {s === 1 ? 'Category' : 'Details'}
            </button>
            {s < 2 && <div className="flex-1 h-px bg-city-border" />}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Step 1: Category ──────────────────────────────────────────── */}
        {step === 1 && (
          <div className="animate-slide-up">
            <p className="font-body text-sm font-medium text-city-subtext mb-4">What type of issue are you reporting?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => { set('category')(cat.value); setStep(2); }}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 hover:scale-[1.02]
                    ${form.category === cat.value
                      ? 'bg-city-orange/10 border-city-orange/50 shadow-orange-glow'
                      : 'bg-city-card border-city-border hover:border-city-orange/30'
                    }`}
                >
                  <span className="text-2xl mb-2">{cat.icon}</span>
                  <span className="font-display text-sm font-semibold text-city-text">{cat.label}</span>
                  <span className="font-body text-xs text-city-muted mt-0.5 leading-tight">{cat.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Details ───────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5 animate-slide-up">

            {/* Selected category */}
            {form.category && (
              <div className="flex items-center gap-3 px-4 py-3 bg-city-orange/5 border border-city-orange/20 rounded-xl">
                <span className="text-xl">{CATEGORIES.find(c => c.value === form.category)?.icon}</span>
                <div>
                  <p className="font-body text-xs text-city-orange/70 font-medium uppercase tracking-wider">Category</p>
                  <p className="font-display text-sm font-semibold text-city-text">{CATEGORIES.find(c => c.value === form.category)?.label}</p>
                </div>
                <button type="button" onClick={() => setStep(1)} className="ml-auto text-city-muted hover:text-city-subtext text-xs font-mono underline">change</button>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block font-body text-xs font-medium text-city-subtext uppercase tracking-wider mb-1.5">
                Issue Title <span className="text-city-red">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Large pothole near Bus Stop 12, Main St"
                value={form.title}
                onChange={set('title')}
                className="input-field"
                maxLength={120}
                required
              />
              <p className="font-mono text-xs text-city-muted mt-1">{form.title.length}/120</p>
            </div>

            {/* Description */}
            <div>
              <label className="block font-body text-xs font-medium text-city-subtext uppercase tracking-wider mb-1.5">
                Description <span className="text-city-red">*</span>
              </label>
              <textarea
                placeholder="Describe the issue in detail. Where exactly? How severe? Any safety risks? (min. 20 characters)"
                value={form.description}
                onChange={set('description')}
                className="input-field resize-none"
                rows={4}
                maxLength={1000}
                required
              />
              <div className="flex items-center justify-between mt-1">
                <p className={`font-mono text-xs ${charCount < 20 ? 'text-city-amber' : 'text-city-muted'}`}>
                  {charCount < 20 ? `${20 - charCount} more characters needed` : `${charCount}/1000`}
                </p>
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label className="block font-body text-xs font-medium text-city-subtext uppercase tracking-wider mb-1.5">
                Photo Evidence <span className="text-city-muted">(optional but recommended)</span>
              </label>
              <ImageUpload
                onUpload={(url) => setForm(f => ({ ...f, imageUrl: url }))}
                onClear={() => setForm(f => ({ ...f, imageUrl: '' }))}
              />
            </div>

            {/* ── TASK 2: Location toggle ─────────────────────────────────── */}
            <div>
              <label className="block font-body text-xs font-medium text-city-subtext uppercase tracking-wider mb-2">
                Location <span className="text-city-red">*</span>
              </label>
              {renderLocationPanel()}
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-shrink-0">
                ← Back
              </button>
              <button
                type="submit"
                disabled={submitting || locStatus !== 'success'}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</>
                  : 'Submit Report →'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ReportIssue;
