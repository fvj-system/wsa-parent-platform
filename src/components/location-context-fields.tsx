"use client";

type LocationContextFieldsProps = {
  locationLabel: string;
  radiusMiles: string;
  weatherCondition: string;
  hideRadius?: boolean;
  weatherHelperText?: string;
  onLocationLabelChange: (value: string) => void;
  onRadiusMilesChange: (value: string) => void;
  onWeatherConditionChange: (value: string) => void;
  onCoordinatesResolved: (coords: { latitude: number; longitude: number; locationLabel: string }) => void;
};

export function LocationContextFields({
  locationLabel,
  radiusMiles,
  weatherCondition,
  hideRadius = false,
  weatherHelperText,
  onLocationLabelChange,
  onRadiusMilesChange,
  onWeatherConditionChange,
  onCoordinatesResolved
}: LocationContextFieldsProps) {
  return (
    <div className="stack">
      <div className="field-section-heading">
        <div>
          <p className="eyebrow">Location context</p>
          <h4>Where should we plan around today?</h4>
        </div>
      </div>

      <div className="split-grid location-context-grid">
        <label>
          Region or home area
          <input
            value={locationLabel}
            onChange={(event) => onLocationLabelChange(event.target.value)}
            placeholder="Southern Maryland, Leonardtown, Solomons..."
          />
        </label>

        {hideRadius ? null : (
          <label>
            Radius
            <select value={radiusMiles} onChange={(event) => onRadiusMilesChange(event.target.value)}>
              <option value="5">Within 5 miles</option>
              <option value="10">Within 10 miles</option>
              <option value="25">Within 25 miles</option>
            </select>
          </label>
        )}
      </div>

      <label>
        Weather today
        <select value={weatherCondition} onChange={(event) => onWeatherConditionChange(event.target.value)}>
          <option value="clear">Clear / fair</option>
          <option value="mixed">Mixed / changeable</option>
          <option value="windy">Windy</option>
          <option value="rainy">Rainy / wet</option>
          <option value="stormy">Stormy / severe nearby</option>
        </select>
        {weatherHelperText ? <p className="field-helper-text">{weatherHelperText}</p> : null}
      </label>

      <div className="cta-row">
        <button
          type="button"
          className="button button-ghost"
          onClick={() => {
            if (!navigator.geolocation) {
              return;
            }

            navigator.geolocation.getCurrentPosition(
              (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                onCoordinatesResolved({
                  latitude,
                  longitude,
                  locationLabel: `Current location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`
                });
              },
              () => {},
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
            );
          }}
        >
          Use current location
        </button>
      </div>
    </div>
  );
}
