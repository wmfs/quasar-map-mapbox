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
  props: [
    'data',
    'm',
    'format',
    'x',
    'y',
    'longitude',
    'latitude',
    'color',
    'id',
    'showMarker',
    'label',
    'locked',
    // Optional button in the popup, e.g. "Choose this address". Clicking it emits popupAction
    'popupActionLabel'
  ],
  inject: ['getMapInstance'],
  data () {
    return {
      markerId: this.id || uuidv4(), // `${this._uid}`,
      markerColour: this.color || locationColour,
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
      map.setLayoutProperty(this.markerId, 'visibility', this.showMarker ? 'visible' : 'none')
    }
  },
  methods: {
    onLoad (mapboxgl, map) {
      setMarker(
          map,
          this.markerId,
          this.position,
          this.markerColour,
          this.showMarker
      )

      // focusAfterOpen: false - Mapbox's close button is aria-hidden, so focusing it
      // makes browsers warn "Blocked aria-hidden on an element because its descendant retained focus"
      const popup = new mapboxgl.Popup({ closeButton: true, closeOnMove: true, focusAfterOpen: false })
      // Listening for @click makes the marker clickable (e.g. to choose a result)
      const clickable = !!(this.$.vnode.props && this.$.vnode.props.onClick)
      const canvas = map.getCanvasContainer()

      popup.on('close', () => {
        this.showingPopup = false
      })

      const addPopup = (e) => {
        if (this.showingPopup) {
          return
        }

        const popupId = `${this.markerId}-popup`
        const label = Array.isArray(this.label) ? this.label : [this.label]

        popup
            .setLngLat(this.position)
            .setHTML(`<div id="${popupId}" class="q-map-popup"></div>`)
            .addTo(map)

        // Mapbox marks its close button aria-hidden but it can still take focus when clicked,
        // which makes browsers warn "Blocked aria-hidden on an element because its descendant retained focus".
        // It already has aria-label="Close popup", so let assistive technology see it.
        const closeButton = popup.getElement() && popup.getElement().querySelector('.mapboxgl-popup-close-button')
        if (closeButton) closeButton.removeAttribute('aria-hidden')

        let popupComponent

        if (this.popupActionLabel) {
          // Label lines are shown as text here, not compiled as a template
          const onAction = () => {
            popup.remove()
            this.$emit('popupAction', { id: this.markerId, longitude: this.position[0], latitude: this.position[1] })
          }
          popupComponent = defineComponent({
            template: `<div style="min-width: 160px;">
              <div v-for="(l, i) in lines" :key="i" :style="i === 0 ? 'font-weight: 700;' : 'color: #505a5f; font-size: 13px;'">{{ l }}</div>
              <button type="button" @click="onAction" style="margin-top: 8px; width: 100%; min-height: 36px; border: 0; border-radius: 4px; background: #00703c; color: #fff; font: inherit; font-weight: 600; cursor: pointer; box-shadow: 0 2px 0 #005a30;">{{ actionLabel }}</button>
            </div>`,
            setup: () => ({ lines: label.filter(l => l), actionLabel: this.popupActionLabel, onAction })
          })
        } else {
          let template = '<div>'
          template += label.map(l => `<div>${l}</div>`).join('')
          template += '</div>'

          popupComponent = defineComponent({
            template,
            props: ['data', 'm']
          })
        }

        createApp(popupComponent).mount(document.getElementById(popupId))

        this.showingPopup = true
      }

      if (!this.locked && !map.locked) {
        map.on('mouseenter', this.markerId, () => {
          canvas.style.cursor = 'grab'
        })
        map.on('mousedown', this.markerId, e => {
          e.preventDefault()
          canvas.style.cursor = 'grabbing'
          popup.remove()
          const onMove = e => this.onMove(e, map)
          map.on('mousemove', onMove)
          map.once('mouseup', e => this.onUp(e, map, onMove))
        })
      } else {
        map.on('mouseenter', this.markerId, () => {
          if (this.label || clickable) canvas.style.cursor = 'pointer'
        })
      }

      map.on('click', this.markerId, (e) => {
        if (clickable) {
          this.$emit('click', { id: this.markerId, longitude: this.position[0], latitude: this.position[1] })
        }
        if (this.label) {
          addPopup(e)
        }
      })

      map.on('mouseleave', this.markerId, () => {
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
      map.getSource(this.markerId).setData(makeSource([lng, lat]).data)
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
          this.markerId,
          this.position,
          this.markerColour,
          this.showMarker
      )
    },
    updateLatLon () {
      this.position = [this.longitude, this.latitude]
      setMarker(
          this.map,
          this.markerId,
          this.position,
          this.markerColour,
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
