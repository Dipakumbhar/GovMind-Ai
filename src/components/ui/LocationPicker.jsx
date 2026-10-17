import { useState, useCallback, useEffect, useRef } from 'react';
import {
  MapPin, Navigation, Search, CheckCircle, AlertCircle,
  Loader2, X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// ── Fix Leaflet default marker icon (broken in Vite/bundlers) ──
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [20.5937, 78.9629]; // geographic centre of India
const DEFAULT_ZOOM   = 5;
const SELECTED_ZOOM  = 15;

// Nominatim requires a descriptive User-Agent per its usage policy
const NOMINATIM_UA =
  'GovMindAI/1.0 (college civic-governance project; not-for-production)';

// ─────────────────────────────────────────────
//  Inner map sub-components (must live inside MapContainer)
// ─────────────────────────────────────────────

/** Flies the map to new coords, but only when they actually change */
function MapCenterer({ lat, lng }) {
  const map     = useMap();
  const prevRef = useRef(null);
  useEffect(() => {
    if (!lat || !lng) return;
    const key = `${lat},${lng}`;
    if (prevRef.current === key) return;
    prevRef.current = key;
    map.flyTo([lat, lng], SELECTED_ZOOM, { duration: 1 });
  }, [lat, lng, map]);
  return null;
}

/** Drops/moves the marker when the user clicks the map */
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

// ─────────────────────────────────────────────
//  Nominatim API helpers
// ─────────────────────────────────────────────

/** Forward geocode — returns array of Nominatim result objects */
async function forwardGeocode(query) {
  const params = new URLSearchParams({
    q: query, format: 'jsonv2', addressdetails: '1', limit: '6',
  });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': NOMINATIM_UA } },
  );
  if (!res.ok) throw new Error(`Nominatim error ${res.status}`);
  return res.json();
}

/** Reverse geocode — returns display_name string or null */
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': NOMINATIM_UA } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.display_name || null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────

/**
 * LocationPicker
 * Props:
 *   value    – { address, ward, pincode, lat, lng }
 *   onChange – (obj) => void
 */
export default function LocationPicker({ value = {}, onChange }) {
  const { t } = useTranslation();

  // Geolocation state
  const [geoStatus,  setGeoStatus]  = useState('idle'); // idle | loading | success | error
  const [geoMessage, setGeoMessage] = useState('');

  // Reverse-geocoding spinner (shown under coords)
  const [geocoding, setGeocoding] = useState(false);

  // Search state
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchStatus,  setSearchStatus]  = useState('idle'); // idle | loading | error | done
  const [searchError,   setSearchError]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults,   setShowResults]   = useState(false);

  // Close the dropdown when user clicks outside the search box
  const searchBoxRef = useRef(null);
  useEffect(() => {
    function onOutsideClick(e) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  // ── field helper ──
  const updateField = useCallback(
    (field, val) => onChange({ ...value, [field]: val }),
    [value, onChange],
  );

  // ── Map click → place marker + reverse geocode ──
  const handleMapClick = useCallback(
    async (lat, lng) => {
      // Place marker immediately for instant feedback
      onChange({ ...value, lat: String(lat), lng: String(lng) });
      setGeocoding(true);
      const address = await reverseGeocode(lat, lng);
      setGeocoding(false);
      if (address) {
        onChange({ ...value, lat: String(lat), lng: String(lng), address });
      }
    },
    [value, onChange],
  );

  // ── Location search using Nominatim forward geocoding ──
  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setSearchStatus('loading');
    setSearchError('');
    setSearchResults([]);
    setShowResults(false);

    try {
      const results = await forwardGeocode(q);
      setSearchStatus('done');
      setSearchResults(results);
      setShowResults(true);           // show dropdown (empty or populated)
    } catch {
      setSearchStatus('error');
      setSearchError(
        'Search failed. Please check your connection and try again.',
      );
    }
  };

  // ── User picks a result from the dropdown ──
  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    onChange({
      ...value,
      lat:     String(lat),
      lng:     String(lng),
      address: result.display_name,
    });
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
    setSearchStatus('idle');
    setSearchError('');
  };

  // ── Use My Current Location (browser Geolocation API) ──
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      setGeoMessage(t('location.geoNotSupported'));
      return;
    }
    setGeoStatus('loading');
    setGeoMessage('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Place marker first — fast feedback
        onChange({ ...value, lat: String(lat), lng: String(lng) });
        setGeoStatus('success');
        setGeoMessage(t('location.locationDetected'));

        // Then reverse-geocode to fill the address field
        setGeocoding(true);
        const address = await reverseGeocode(lat, lng);
        setGeocoding(false);
        if (address) {
          onChange({ ...value, lat: String(lat), lng: String(lng), address });
        }
      },
      (err) => {
        setGeoStatus('error');
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoMessage(t('location.permissionDenied')); break;
          case err.POSITION_UNAVAILABLE:
            setGeoMessage(t('location.positionUnavailable')); break;
          case err.TIMEOUT:
            setGeoMessage(t('location.timeout')); break;
          default:
            setGeoMessage(t('location.geoError'));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const hasCoords = Boolean(value.lat && value.lng);
  const lat = hasCoords ? parseFloat(value.lat) : null;
  const lng = hasCoords ? parseFloat(value.lng) : null;

  return (
    <div className="space-y-4">

      {/* ── Search bar with Nominatim forward geocoding ── */}
      <div ref={searchBoxRef}>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Search Location
        </label>

        <div className="flex gap-2">
          {/* Input */}
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
            />
            <input
              id="location-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (showResults) setShowResults(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleSearch(); }
                if (e.key === 'Escape') setShowResults(false);
              }}
              placeholder="Search for a location or address..."
              aria-label="Search location"
              aria-expanded={showResults}
              autoComplete="off"
              className="w-full border border-border rounded-lg pl-9 pr-8 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
            />
            {/* Clear button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowResults(false);
                  setSearchResults([]);
                  setSearchStatus('idle');
                  setSearchError('');
                }}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2
                           text-text-secondary hover:text-text-primary"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search button */}
          <button
            id="location-search-btn"
            type="button"
            onClick={handleSearch}
            disabled={searchStatus === 'loading' || !searchQuery.trim()}
            aria-label="Search location"
            className="bg-navy text-white px-4 rounded-lg hover:bg-navy-dark
                       transition-colors text-sm font-medium
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center min-w-[44px]"
          >
            {searchStatus === 'loading'
              ? <Loader2 size={16} className="animate-spin" />
              : <Search size={16} />}
          </button>
        </div>

        {/* Search network error */}
        {searchStatus === 'error' && (
          <div
            role="alert"
            className="mt-2 flex items-start gap-2 bg-critical/5 border border-critical/20
                       rounded-lg px-3 py-2"
          >
            <AlertCircle size={14} className="text-critical mt-0.5 shrink-0" />
            <p className="text-xs text-critical">{searchError}</p>
          </div>
        )}

        {/* Results dropdown */}
        {showResults && (
          <div
            role="listbox"
            aria-label="Search results"
            className="mt-1 border border-border rounded-lg bg-white shadow-lg overflow-hidden z-50 relative"
          >
            {searchResults.length === 0 ? (
              <div className="px-3 py-3 text-sm text-text-secondary">
                No locations found for &ldquo;{searchQuery}&rdquo;. Try a different search term.
              </div>
            ) : (
              <ul className="divide-y divide-border max-h-56 overflow-y-auto">
                {searchResults.map((result) => (
                  <li key={result.place_id}>
                    <button
                      type="button"
                      onClick={() => handleSelectResult(result)}
                      className="w-full text-left flex items-start gap-2.5 px-3 py-2.5
                                 hover:bg-navy/5 transition-colors focus:outline-none focus:bg-navy/5"
                    >
                      <MapPin size={14} className="text-navy mt-0.5 shrink-0" />
                      <span className="text-sm text-text-primary leading-snug line-clamp-2">
                        {result.display_name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-border px-3 py-1.5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowResults(false)}
                className="text-xs text-text-secondary hover:text-text-primary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Use My Current Location ── */}
      <button
        id="use-current-location-btn"
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={geoStatus === 'loading'}
        aria-label={t('location.useCurrentLocation')}
        className={`inline-flex items-center gap-2 text-sm font-medium rounded-lg px-4 py-2.5
                    border transition-colors
                    ${geoStatus === 'loading'
                      ? 'border-border text-text-secondary cursor-not-allowed bg-page-bg'
                      : 'border-navy/20 text-navy bg-navy/5 hover:bg-navy/10 hover:border-navy/30'
                    }`}
      >
        {geoStatus === 'loading'
          ? <Loader2 size={16} className="animate-spin" />
          : <Navigation size={16} />}
        {geoStatus === 'loading'
          ? t('location.detecting')
          : t('location.useCurrentLocation')}
      </button>

      {/* Geolocation success banner */}
      {geoStatus === 'success' && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2 bg-success/5 border border-success/20
                     rounded-lg px-3 py-2.5"
        >
          <CheckCircle size={16} className="text-success mt-0.5 shrink-0" />
          <p className="text-sm text-success font-medium">{geoMessage}</p>
        </div>
      )}

      {/* Geolocation error banner */}
      {geoStatus === 'error' && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2 bg-critical/5 border border-critical/20
                     rounded-lg px-3 py-2.5"
        >
          <AlertCircle size={16} className="text-critical mt-0.5 shrink-0" />
          <p className="text-sm text-critical">{geoMessage}</p>
        </div>
      )}

      {/* Map instruction */}
      <p className="text-xs text-text-secondary bg-navy/5 border border-navy/10 rounded-lg px-3 py-2">
        <span className="font-medium text-navy">📍 </span>
        {t('location.mapInstruction')}
      </p>

      {/* ── Interactive Leaflet / OpenStreetMap ── */}
      <div className="border border-border rounded-lg overflow-hidden">
        <MapContainer
          center={hasCoords ? [lat, lng] : DEFAULT_CENTER}
          zoom={hasCoords ? SELECTED_ZOOM : DEFAULT_ZOOM}
          className="location-map-container"
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Fly to new position whenever coords change */}
          {hasCoords && <MapCenterer lat={lat} lng={lng} />}

          {/* Handle map clicks */}
          <MapClickHandler onMapClick={handleMapClick} />

          {/* Marker */}
          {hasCoords && (
            <Marker position={[lat, lng]}>
              <Popup>
                <div className="text-xs leading-snug">
                  <p className="font-semibold mb-1">📍 Selected Location</p>
                  <p>Lat: {parseFloat(value.lat).toFixed(6)}</p>
                  <p>Lng: {parseFloat(value.lng).toFixed(6)}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* ── Coordinates display ── */}
      {hasCoords && (
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <MapPin size={13} className="text-navy shrink-0" />
          <span>
            <span className="font-medium text-text-primary">Selected coordinates:</span>
            {' '}{parseFloat(value.lat).toFixed(6)}, {parseFloat(value.lng).toFixed(6)}
            {geocoding && (
              <span className="ml-2 inline-flex items-center gap-1">
                <Loader2 size={11} className="animate-spin" /> fetching address…
              </span>
            )}
          </span>
        </div>
      )}

      {/* ── Address & Ward ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="location-address"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            {t('location.addressLabel')} <span className="text-critical">*</span>
          </label>
          <div className="relative">
            <MapPin
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
            />
            <input
              id="location-address"
              type="text"
              value={value.address || ''}
              onChange={(e) => updateField('address', e.target.value)}
              required
              placeholder={t('location.addressPlaceholder')}
              className="w-full border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="location-ward"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            {t('location.wardLabel')}
          </label>
          <input
            id="location-ward"
            type="text"
            value={value.ward || ''}
            onChange={(e) => updateField('ward', e.target.value)}
            placeholder={t('location.wardPlaceholder')}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
          />
        </div>
      </div>

      {/* ── Pincode ── */}
      <div className="max-w-xs">
        <label
          htmlFor="location-pincode"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          {t('location.pincodeLabel')}
        </label>
        <input
          id="location-pincode"
          type="text"
          value={value.pincode || ''}
          onChange={(e) => updateField('pincode', e.target.value)}
          placeholder={t('location.pincodePlaceholder')}
          maxLength={6}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
        />
      </div>
    </div>
  );
}
