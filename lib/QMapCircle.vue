<template>
  <div></div>
</template>

<script>

const locationColour = '#2222B4'
const prevLocationColour = '#6666D8'

export default {
  name: 'Q-Mapcircle',
  props: [
    'longitude',
    'latitude',
    'color',
    'id'
  ],
  data () {
    const position = [this.longitude, this.latitude]
    const colour = this.color || locationColour
    const id = this.id || `${this._uid}`

    return {
      markerId: id,
      markerColour: colour,
      position: position
    }
  },
  methods: {
    onLoad (map) {
      this.addMarker(
        map,
        this.markerId,
        this.position,
        this.markerColour
      )
    },

    addMarker (map, id, centre, colour) {
      if (map.getLayer(id)) {
        map.removeLayer(id)
        map.removeSource(id)
      }

      map.addSource(id, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: centre
            }
          }]
        }
      })

      const markerLayer = {
        id: id,
        type: 'circle',
        source: id,
        paint: paintCircle(colour),
        filter: ['==', '$type', 'Point']
      }

      map.addLayer(markerLayer)
    } // addMarker
  } // methods
} // export default

function paintCircle (colour) {
  return {
    'circle-radius': 6,
    'circle-color': colour,
    'circle-stroke-width': 5,
    'circle-stroke-color': colour,
    'circle-stroke-opacity': 0.5
  }
} // paintCircle

</script>
