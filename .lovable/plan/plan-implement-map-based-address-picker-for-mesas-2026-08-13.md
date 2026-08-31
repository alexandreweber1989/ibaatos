# Plan - Implement Map-based Address Picker for Mesas

The user wants a map interface where they can pick an address using a pin, specifically because the current address autocomplete is not working as expected. I will implement a visual map selector using Leaflet (since Google Maps API is not currently loaded in the root) and integrate it into the address management flow.

## Proposed Changes

### UI Components

- **`src/components/ui/map-picker.tsx`**: Create a new component using Leaflet that allows users to search for an address and/or drag a pin to select a location.
- **`src/components/ui/address-autocomplete.tsx`**: Fix the autocomplete logic (it currently relies on `window.google` which is missing, and the fallback needs verification) and add a button to open the map picker.
- **`src/components/admin/address-manager.tsx`**: Add a "Select on Map" button that opens a dialog with the map picker.

### Data & Logic

- Update the address selection logic to handle coordinates (latitude/longitude) if needed, though the primary goal is capturing the street, number, neighborhood, and city.
- Ensure the selected address from the map is correctly populated into the address form.

### External Dependencies

- Add `leaflet` and `react-leaflet` to `package.json`.
- Add Leaflet CSS to `src/routes/__root.tsx`.

## Technical Details

- Use **OpenStreetMap Nominatim** for reverse geocoding when the pin is dropped.
- Use `ClientOnly` to wrap the Leaflet map to prevent SSR issues.
- The map picker will return a structured address object compatible with the existing `mesa_addresses` table.

## Verification Plan

- **Manual Verification**: Test the search functionality in the autocomplete field.
- **Manual Verification**: Open the map picker, drag the pin, and verify the address fields (street, number, etc.) are populated.
- **Visual Check**: Ensure the map renders correctly and is responsive.
- **Build Check**: Run `bun run build` to ensure no regressions.
