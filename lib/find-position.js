/* eslint-disable */
import OsGridRef, { LatLon } from 'geodesy/osgridref.js'

export default function ({ latitude, longitude, x, y, format }) {
  latitude = latitude || 0
  longitude = longitude || 0

  if (format === 'OSGridRef') {
    if (x && y) {
      const gridref = new OsGridRef(x, y)
      const pWgs84 = gridref.toLatLon()

      latitude = pWgs84._lat
      longitude = pWgs84._lon
    } else {
      latitude = 0
      longitude = 0
    }
  }

  return [longitude, latitude]
}
