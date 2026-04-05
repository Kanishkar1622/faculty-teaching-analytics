import { DEFAULT_CAMPUS_CENTER, DEFAULT_CAMPUS_RADIUS, getDistanceMeters, isPointInPolygon } from '../lib/geolocation';

console.log('Campus Center =>', DEFAULT_CAMPUS_CENTER);
console.log('Campus Radius =>', DEFAULT_CAMPUS_RADIUS);

const testPointOutside = {
  latitude: DEFAULT_CAMPUS_CENTER.latitude + 0.01,
  longitude: DEFAULT_CAMPUS_CENTER.longitude + 0.01
};

const testPointInside = {
  latitude: DEFAULT_CAMPUS_CENTER.latitude + 0.001,
  longitude: DEFAULT_CAMPUS_CENTER.longitude + 0.001
};

console.log('Distance from center to testPointOutside:', getDistanceMeters(DEFAULT_CAMPUS_CENTER, testPointOutside), 'meters');
console.log('Distance from center to testPointInside:', getDistanceMeters(DEFAULT_CAMPUS_CENTER, testPointInside), 'meters');
