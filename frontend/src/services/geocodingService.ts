export interface GeocodeAddress {
  formattedAddress: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  address: GeocodeAddress;
  displayName: string;
}

// In-memory cache for reverse geocoding to prevent repetitive requests
const cache = new Map<string, GeocodeAddress>();

// Simple queue / rate-limiter to respect OpenStreetMap Nominatim 1 request/sec policy
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1000;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - timeSinceLast));
  }
  lastRequestTime = Date.now();

  return fetch(url, {
    headers: {
      Accept: 'application/json',
      // Nominatim requires an identifiable User-Agent
      'User-Agent': 'RouteWise-EmergencyDispatch/1.0 (Emergency Response & Dispatch System)',
    },
  });
}

export const geocodingService = {
  /**
   * Reverse geocodes coordinates to a human-readable address with locality, city, district, and state.
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodeAddress> {
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`;
      const res = await rateLimitedFetch(url);

      if (!res.ok) {
        throw new Error(`Reverse geocoding failed with status: ${res.status}`);
      }

      const data = await res.json();
      const addr = data.address || {};

      const road = addr.road || addr.pedestrian || addr.street;
      const neighbourhood = addr.neighbourhood || addr.suburb || addr.residential;
      const locality = addr.suburb || addr.village || addr.neighbourhood || addr.town;
      const city = addr.city || addr.town || addr.municipality || addr.county || addr.state_district;
      const district = addr.state_district || addr.county || addr.district;
      const state = addr.state;
      const postcode = addr.postcode;
      const country = addr.country;

      // Build readable address from available components
      const parts: string[] = [];
      if (road) parts.push(road);
      if (neighbourhood && neighbourhood !== road) parts.push(neighbourhood);
      if (locality && locality !== neighbourhood) parts.push(locality);
      if (city && city !== locality) parts.push(city);
      if (district && district !== city) parts.push(district);
      if (state) parts.push(state);
      if (postcode) parts.push(postcode);

      const formattedAddress = parts.length > 0 ? parts.join(', ') : data.display_name || `${latitude.toFixed(5)}°, ${longitude.toFixed(5)}°`;

      const result: GeocodeAddress = {
        formattedAddress,
        road,
        neighbourhood,
        suburb: addr.suburb,
        locality,
        city,
        district,
        state,
        postcode,
        country,
      };

      cache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('Reverse geocoding unavailable or timed out:', err);
      // Fallback: return coordinate-based label without falsifying location
      return {
        formattedAddress: `Coordinates: ${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E`,
      };
    }
  },

  /**
   * Forward geocodes an address or landmark search query to coordinates and parsed address.
   */
  async searchAddress(query: string): Promise<GeocodeResult[]> {
    if (!query || query.trim().length < 3) return [];

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`;
      const res = await rateLimitedFetch(url);

      if (!res.ok) {
        throw new Error(`Search failed with status ${res.status}`);
      }

      const list = await res.json();
      return list.map((item: any) => {
        const addr = item.address || {};
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        return {
          latitude: lat,
          longitude: lon,
          displayName: item.display_name,
          address: {
            formattedAddress: item.display_name,
            road: addr.road,
            neighbourhood: addr.neighbourhood,
            suburb: addr.suburb,
            locality: addr.suburb || addr.town || addr.village,
            city: addr.city || addr.town || addr.municipality,
            district: addr.state_district || addr.county,
            state: addr.state,
            postcode: addr.postcode,
            country: addr.country,
          },
        };
      });
    } catch (err) {
      console.warn('Address search failed:', err);
      return [];
    }
  },
};
