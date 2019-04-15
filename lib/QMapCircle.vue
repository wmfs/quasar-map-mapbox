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
      setMarker(
        map,
        this.markerId,
        this.position,
        this.markerColour
      )

      if (!this.locked && !map.locked) {
        const canvas = map.getCanvasContainer()
        map.on('mouseenter', this.markerId, () => {
          canvas.style.cursor = 'move'
        })
        map.on('mouseleave', this.markerId, () => {
          canvas.style.cursor = ''
        })
        map.on('mousedown', this.markerId, e => {
          e.preventDefault()
          canvas.style.cursor = 'grab'
          const onMove = e => this.onMove(e, map)
          map.on('mousemove', onMove)
          map.once('mouseup', e => this.onUp(e, map, onMove))
        })
      }
    },
    onMove (e, map) {
      map.getCanvasContainer().style.cursor = 'grabbing'

      const centre = [e.lngLat.lng, e.lngLat.lat]
      this.$emit('longitude', centre[0])
      this.$emit('latitude', centre[1])
      map.getSource(this.markerId).setData(makeSource(centre).data);
    },
    onUp (e, map, onMove) {
      map.getCanvasContainer().style.cursor = ''
      map.off('mousemove', onMove)
    } // onUp
  } // methods
} // export default


function setMarker (map, id, centre, colour) {
  if (map.getLayer(id)) {
    map.removeLayer(id)
    map.removeSource(id)
  }

  map.addSource(id, makeSource(centre))

  const markerLayer = {
    id: id,
    type: 'circle',
    source: id,
    paint: paintCircle(colour),
    filter: ['==', '$type', 'Point']
  }

  map.addLayer(markerLayer)
} // setMarker

function makeSource (centre) {
  return {
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
  }
} //

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
