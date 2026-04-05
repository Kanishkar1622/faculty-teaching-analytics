/**
 * Geolocation utilities for campus polygon geofencing.
 * Uses ray-casting algorithm for point-in-polygon check
 * and Haversine formula for distance calculations.
 */

export interface GeoPosition {
    latitude: number
    longitude: number
}

/**
 * Calculate distance in meters between two GPS coordinates using the Haversine formula.
 */
export function getDistanceMeters(pos1: GeoPosition, pos2: GeoPosition): number {
    const R = 6371000 // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180

    const dLat = toRad(pos2.latitude - pos1.latitude)
    const dLon = toRad(pos2.longitude - pos1.longitude)

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(pos1.latitude)) *
        Math.cos(toRad(pos2.latitude)) *
        Math.sin(dLon / 2) ** 2

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c)
}

/**
 * Check if a point lies inside a polygon using the ray-casting algorithm.
 * The polygon is defined as an array of {latitude, longitude} points.
 * Returns true if the point is inside the polygon.
 */
export function isPointInPolygon(
    point: GeoPosition,
    polygon: GeoPosition[]
): boolean {
    if (polygon.length < 3) return false

    let inside = false
    const x = point.longitude
    const y = point.latitude

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].longitude
        const yi = polygon[i].latitude
        const xj = polygon[j].longitude
        const yj = polygon[j].latitude

        const intersect =
            yi > y !== yj > y &&
            x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

        if (intersect) inside = !inside
    }

    return inside
}

/**
 * Calculate the centroid (center) of a polygon.
 */
export function getPolygonCenter(polygon: GeoPosition[]): GeoPosition {
    if (polygon.length === 0) return { latitude: 0, longitude: 0 }
    const lat = polygon.reduce((s, p) => s + p.latitude, 0) / polygon.length
    const lng = polygon.reduce((s, p) => s + p.longitude, 0) / polygon.length
    return { latitude: lat, longitude: lng }
}

/**
 * Get the minimum distance from a point to the nearest edge of the polygon.
 * Returns 0 if the point is inside the polygon.
 */
export function getDistanceToPolygon(
    point: GeoPosition,
    polygon: GeoPosition[]
): number {
    if (isPointInPolygon(point, polygon)) return 0

    // Find distance to nearest polygon vertex as an approximation
    let minDist = Infinity
    for (const vertex of polygon) {
        const d = getDistanceMeters(point, vertex)
        if (d < minDist) minDist = d
    }
    return minDist
}

/**
 * Get the current GPS position from the browser.
 * Returns a Promise that resolves with the position or rejects with an error message.
 */
export function getCurrentPosition(): Promise<GeoPosition> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject("Geolocation is not supported by your browser")
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                })
            },
            (error) => {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        reject("Location access denied. Please enable GPS to mark attendance.")
                        break
                    case error.POSITION_UNAVAILABLE:
                        if (process.env.NODE_ENV === 'development') {
                            console.warn("Dev mode: Location unavailable, using mock campus center.")
                            resolve(DEFAULT_CAMPUS_CENTER)
                        } else {
                            reject("Location information is unavailable. Please ensure your device has a clear view of the sky or is connected to Wi-Fi.")
                        }
                        break
                    case error.TIMEOUT:
                        if (process.env.NODE_ENV === 'development') {
                            console.warn("Dev mode: Location request timed out, using mock campus center.")
                            resolve(DEFAULT_CAMPUS_CENTER)
                        } else {
                            reject("Location request timed out. Please try again.")
                        }
                        break
                    default:
                        reject("An unknown error occurred while fetching location.")
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        )
    })
}

// Default campus center (can be overridden by admin in Firestore)
export const DEFAULT_CAMPUS_CENTER: GeoPosition = {
    latitude: 11.49556635735395,
    longitude: 77.2788143157023,
}
export const DEFAULT_CAMPUS_RADIUS = 500 // meters
