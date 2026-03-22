// =============================================================================
// RASHTRA LOCATION SERVICE
// GPS coordinates → human-readable address + road classification via Nominatim
// No API key required. Single reverse-geocode call; result cached by coordinate.
// =============================================================================

import { RoadType } from '../types';

export interface LocationInfo {
  name: string;
  area: string;
  fullAddress: string;
  roadType: RoadType;
  roadTypeSource: 'osm' | 'fallback'; // 'osm' = tag was present; 'fallback' = inferred
}

const locationCache = new Map<string, LocationInfo>();

// ---------------------------------------------------------------------------
// OSM highway tag → RoadType
// Nominatim returns top-level `class` = "highway" and `type` = the tag value
// (motorway, trunk, primary, secondary, tertiary, residential, service, …)
// Reference: https://wiki.openstreetmap.org/wiki/Key:highway
// ---------------------------------------------------------------------------
function osmHighwayTagToRoadType(tag: string): { roadType: RoadType; source: 'osm' } {
  const t = tag.toLowerCase();

  if (t === 'motorway' || t === 'motorway_link')
    return { roadType: RoadType.NATIONAL_HIGHWAY, source: 'osm' };

  if (t === 'trunk' || t === 'trunk_link')
    return { roadType: RoadType.STATE_HIGHWAY, source: 'osm' };

  if (t === 'primary' || t === 'primary_link' || t === 'secondary' || t === 'secondary_link')
    return { roadType: RoadType.MAIN_ROAD, source: 'osm' };

  if (t === 'tertiary' || t === 'tertiary_link' || t === 'unclassified' || t === 'residential')
    return { roadType: RoadType.STREET, source: 'osm' };

  // service / living_street / footway / track / path / steps
  return { roadType: RoadType.LANE, source: 'osm' };
}

// Name-based heuristic — only fires when OSM snaps to a building/POI
// and the adjacent road's highway tag is unavailable in addressdetails.
function inferRoadTypeFromName(roadName: string): { roadType: RoadType; source: 'osm' | 'fallback' } {
  const n = roadName.toUpperCase();
  if (/\bNH\b/.test(n) || /NATIONAL\s*HIGHWAY/.test(n) || /EXPRESSWAY/.test(n))
    return { roadType: RoadType.NATIONAL_HIGHWAY, source: 'osm' };
  if (/\bSH\b/.test(n) || /STATE\s*HIGHWAY/.test(n))
    return { roadType: RoadType.STATE_HIGHWAY, source: 'osm' };
  if (/\bMDR\b/.test(n) || /MAIN\s*ROAD/.test(n) || /ARTERIAL/.test(n) || /BYPASS/.test(n))
    return { roadType: RoadType.MAIN_ROAD, source: 'osm' };
  if (/LANE/.test(n) || /GALLI/.test(n) || /WADI/.test(n))
    return { roadType: RoadType.LANE, source: 'fallback' };
  return { roadType: RoadType.STREET, source: 'fallback' };
}

export async function resolveLocationFromGPS(
  lat: number,
  lng: number,
): Promise<LocationInfo> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (locationCache.has(cacheKey)) return locationCache.get(cacheKey)!;

  const fallback: LocationInfo = {
    name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    area: 'Solapur',
    fullAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)} — Solapur`,
    roadType: RoadType.STREET,
    roadTypeSource: 'fallback',
  };

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'RashtraApp/1.0' } }
    );
    if (!res.ok) return fallback;

    const data = await res.json();
    const addr = data.address ?? {};

    const name =
      addr.road || addr.pedestrian || addr.neighbourhood || addr.suburb ||
      data.display_name?.split(',')[0] || fallback.name;
    const area =
      addr.suburb || addr.neighbourhood || addr.city_district || addr.city || 'Solapur';
    const fullAddress = data.display_name || fallback.fullAddress;

    // Road classification logic:
    // When Nominatim snaps directly to a road segment, top-level `class` = "highway"
    // and `type` carries the OSM highway tag — most reliable path.
    // When snapped to a building/POI, `addr.road` has the adjacent road name; use
    // name heuristics as fallback signal.
    let roadTypeResult: { roadType: RoadType; source: 'osm' | 'fallback' };

    if (data.class === 'highway' && data.type) {
      roadTypeResult = osmHighwayTagToRoadType(data.type);
    } else if (addr.road) {
      roadTypeResult = inferRoadTypeFromName(addr.road);
    } else {
      roadTypeResult = { roadType: RoadType.STREET, source: 'fallback' };
    }

    const result: LocationInfo = {
      name, area, fullAddress,
      roadType: roadTypeResult.roadType,
      roadTypeSource: roadTypeResult.source,
    };

    locationCache.set(cacheKey, result);
    return result;
  } catch {
    return fallback;
  }
}