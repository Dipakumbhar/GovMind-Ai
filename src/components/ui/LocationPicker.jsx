import { useState } from 'react';
import { MapPin, Search, Navigation, Map } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Reusable LocationPicker component.
 *
 * Currently uses a clean placeholder UI.
 * Designed so Google Maps / OpenStreetMap can be plugged in later by:
 *   1. Replacing the MapPlaceholder with a real map component
 *   2. Implementing the searchLocation / useCurrentLocation handlers
 *   3. Passing lat/lng from map clicks back via onChange
 *
 * Props:
 *   value    – { address, ward, pincode, lat, lng }
 *   onChange – (locationObj) => void
 */
export default function LocationPicker({ value = {}, onChange }) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleFieldChange = (field, val) => {
    onChange({ ...value, [field]: val });
  };

  const handleSearch = () => {
    // TODO: Replace with actual geocoding API call
    if (searchQuery.trim()) {
      handleFieldChange('address', searchQuery.trim());
    }
  };

  const handleUseCurrentLocation = () => {
    // TODO: Replace with navigator.geolocation and reverse-geocoding
    handleFieldChange('address', 'Current Location (Demo)');
    handleFieldChange('lat', '18.5204');
    handleFieldChange('lng', '73.8567');
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          {t('location.searchPlaceholder')}
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
              placeholder={t('location.searchPlaceholder')}
              className="w-full border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="bg-navy text-white px-4 rounded-lg hover:bg-navy-dark transition-colors text-sm font-medium"
          >
            <Search size={16} />
          </button>
        </div>
      </div>

      {/* Use current location button */}
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        className="flex items-center gap-2 text-sm text-navy font-medium hover:text-saffron transition-colors"
      >
        <Navigation size={16} />
        {t('location.useCurrentLocation')}
      </button>

      {/* Map placeholder */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-page-bg h-52 flex flex-col items-center justify-center text-text-secondary relative">
          <div className="absolute inset-0 opacity-10">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  'linear-gradient(#D9E2EC 1px, transparent 1px), linear-gradient(90deg, #D9E2EC 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }}
            />
          </div>
          <Map size={36} className="text-navy/30 mb-2 relative z-10" />
          <p className="text-sm font-medium text-navy/40 relative z-10">{t('location.mapPlaceholder')}</p>
          <p className="text-xs text-text-secondary/60 relative z-10 mt-1">{t('location.mapNote')}</p>
          {value.lat && value.lng && (
            <div className="absolute bottom-2 left-2 bg-white border border-border rounded px-2 py-1 text-[11px] text-text-secondary z-10">
              📍 {value.lat}, {value.lng}
            </div>
          )}
        </div>
      </div>

      {/* Address & Ward fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            {t('location.addressLabel')} <span className="text-critical">*</span>
          </label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={value.address || ''}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              required
              placeholder={t('location.addressPlaceholder')}
              className="w-full border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            {t('location.wardLabel')}
          </label>
          <input
            type="text"
            value={value.ward || ''}
            onChange={(e) => handleFieldChange('ward', e.target.value)}
            placeholder={t('location.wardPlaceholder')}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
          />
        </div>
      </div>

      {/* Pincode */}
      <div className="max-w-xs">
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          {t('location.pincodeLabel')}
        </label>
        <input
          type="text"
          value={value.pincode || ''}
          onChange={(e) => handleFieldChange('pincode', e.target.value)}
          placeholder={t('location.pincodePlaceholder')}
          maxLength={6}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
        />
      </div>
    </div>
  );
}
