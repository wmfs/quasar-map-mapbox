<script>
import { throttle } from 'quasar'
import OsGridRef, { LatLon } from 'geodesy/osgridref.js'
import { v4 as uuidv4 } from 'uuid'
import findPosition from './find-position'
import { defineComponent, createApp } from 'vue'

const locationColour = '#443DF6'
// const prevLocationColour = '#6666D8'

export default {
  name: 'QMapCircle',
  props: {
    data: {
      type: Object
    },
    m: {
      type: Object
    },
    format: {
      type: String,
      default: 'LatLon',
      validator (value) {
        return ['LatLon', 'OSGridRef'].includes(value)
      }
    },
    x: {
      type: [String, Number]
    },
    y: {
      type: [String, Number]
    },
    latitude: {
      type: [String, Number]
    },
    longitude: {
      type: [String, Number]
    },
    color: {
      type: String,
      default: locationColour
    },
    id: {
      type: String,
      default () {
        return uuidv4()
      }
    },
    showMarker: {
      type: Boolean
    },
    label: {
      type: [String, Array]
    },
    locked: {
      type: Boolean
    }
  },
  inject: ['getMapInstance'],
  data () {
    return {
      position: findPosition(this),
      show: this.showMarker,
      showingPopup: false,
      marker: null
    }
  },
  watch: {
    longitude () {
      this.updateLatLon()
    },
    latitude () {
      this.updateLatLon()
    },
    x () {
      this.updateXY()
    },
    y () {
      this.updateXY()
    },
    showMarker () {
      const { map } = this.getMapInstance()
      map.setLayoutProperty(this.id, 'visibility', this.showMarker ? 'visible' : 'none')
    }
  },
  methods: {
    onLoad (mapboxgl, map) {
      setMarker(
          map,
          this.id,
          this.position,
          this.color,
          this.showMarker
      )

      const popup = new mapboxgl.Popup({ closeButton: true, closeOnMove: true })
      const canvas = map.getCanvasContainer()

      popup.on('close', () => {
        this.showingPopup = false
      })

      const addPopup = (e) => {
        if (this.showingPopup) {
          return
        }

        const popupId = `${this.id}-popup`
        const label = Array.isArray(this.label) ? this.label : [this.label]

        popup
            .setLngLat(this.position)
            .setHTML(`<div id="${popupId}" class="q-map-popup"></div>`)
            .addTo(map)

        let template = '<div>'
        template += label.map(l => `<div>${l}</div>`).join('')
        template += '</div>'

        const popupComponent = defineComponent({
          template,
          props: ['data', 'm']
        })

        createApp(popupComponent).mount(document.getElementById(popupId))

        this.showingPopup = true
      }

      if (!this.locked && !map.locked) {
        map.on('mouseenter', this.id, () => {
          canvas.style.cursor = 'grab'
        })
        map.on('mousedown', this.id, e => {
          e.preventDefault()
          canvas.style.cursor = 'grabbing'
          popup.remove()
          const onMove = e => this.onMove(e, map)
          map.on('mousemove', onMove)
          map.once('mouseup', e => this.onUp(e, map, onMove))
        })
      } else {
        map.on('mouseenter', this.id, () => {
          if (this.label) canvas.style.cursor = 'pointer'
        })
      }

      map.on('click', this.id, (e) => {
        if (this.label) {
          addPopup(e)
        }
      })

      map.on('mouseleave', this.id, () => {
        canvas.style.cursor = ''
      })
    },
    onMove (e, map) {
      map.getCanvasContainer().style.cursor = 'grabbing'
      const { lat, lng } = e.lngLat
      throttle(() => {
        if (this.format === 'OSGridRef') {
          const grid = new LatLon(lat, lng).toOsGrid()
          this.$emit('x', grid.easting)
          this.$emit('y', grid.northing)
        } else {
          this.$emit('longitude', lng)
          this.$emit('latitude', lat)
        }
      }, 600)()
      map.getSource(this.id).setData(makeSource([lng, lat]).data)
    },
    onUp (e, map, onMove) {
      map.getCanvasContainer().style.cursor = ''
      map.off('mousemove', onMove)
    },
    updateXY () {
      const gridref = new OsGridRef(this.x, this.y)
      const pWgs84 = gridref.toLatLon()
      this.position = [pWgs84._lon, pWgs84._lat]
      setMarker(
          this.map,
          this.id,
          this.position,
          this.color,
          this.showMarker
      )
    },
    updateLatLon () {
      this.position = [this.longitude, this.latitude]
      setMarker(
          this.map,
          this.id,
          this.position,
          this.color,
          this.showMarker
      )
    }
  },
  mounted () {
    const { map, mapboxgl } = this.getMapInstance()
    this.onLoad(mapboxgl, map)
  },
  render () {
    return null
  }
}

function setMarker (map, id, centre, colour, showMarker) {
  if (!map) {
    return
  }

  if (map.getLayer(id)) {
    map.removeLayer(id)
    map.removeSource(id)
  }

  map.addSource(id, makeSource(centre))

  const markerLayer = {
    id,
    type: 'circle',
    source: id,
    paint: paintCircle(colour),
    filter: ['==', '$type', 'Point'],
    layout: {
      visibility: showMarker ? 'visible' : 'none'
    }
  }

  map.addLayer(markerLayer)
}

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
}

function paintCircle (colour) {
  return {
    'circle-radius': 6,
    'circle-color': colour,
    'circle-stroke-width': 5,
    'circle-stroke-color': colour,
    'circle-stroke-opacity': 0.5
  }
}
</script>
