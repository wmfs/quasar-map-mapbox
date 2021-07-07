<template>
  <div></div>
</template>
<style>
.mapboxgl-popup-content {
  padding: 0px !important;
}
</style>
<script>
// TODO: mapbox marker hard to move on touchscreen when zoomed out
import mapboxgl from 'mapbox-gl'
import {
  throttle,
  QBtn,
  QCard,
  QCardSection,
  QCardActions,
  QMenu,
  QList,
  QItem,
  QItemLabel
} from 'quasar'
import OsGridRef, { LatLon } from 'geodesy/osgridref.js'
import Vue from 'vue'

const locationColour = '#443DF6'
// const prevLocationColour = '#6666D8'

export default {
  name: 'Q-Mapcircle',
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
    'showLaunches',
    'launches'
  ],
  data () {
    let latitude = this.latitude || 0
    let longitude = this.longitude || 0

    if (this.format === 'OSGridRef') {
      if (this.x && this.y) {
        const gridref = new OsGridRef(this.x, this.y)
        const pWgs84 = gridref.toLatLon()

        latitude = pWgs84._lat
        longitude = pWgs84._lon
      } else {
        latitude = 0
        longitude = 0
      }
    }

    return {
      markerId: this.id || `${this._uid}`,
      markerColour: this.color || locationColour,
      position: [longitude, latitude],
      show: this.showMarker,
      map: null,
      showingPopup: false
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
      this.map.setLayoutProperty(this.markerId, 'visibility', this.showMarker ? 'visible' : 'none')
    }
  },
  methods: {
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
    },
    onLoad (map) {
      this.map = map

      setMarker(
          map,
          this.markerId,
          this.position,
          this.markerColour,
          this.showMarker
      )

      const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false })
      const canvas = map.getCanvasContainer()

      popup.on('close', () => {
        this.showingPopup = false
      })

      const removePopup = () => {
        this.showingPopup = false
        popup.remove()
      }

      const addPopup = () => {
        if (this.showingPopup) return

        const otherPopups = document.getElementsByClassName('mapboxgl-popup')
        if (otherPopups.length) return

        const popupId = `${this.markerId}-popup`
        const label = Array.isArray(this.label) ? this.label : [this.label]

        popup
            .setLngLat(this.position)
            .setHTML(`<div id="${popupId}" class="q-map-popup"></div>`)
            .addTo(map)

        const launches = this.showLaunches ? getPopupLaunches(this.launches) : ''
        const template = getPopupTemplate(label, launches)

        const that = this

        const Popup = Vue.extend({
          template,
          props: ['data', 'm'],
          components: {
            QBtn,
            QCard,
            QCardSection,
            QCardActions,
            QMenu,
            QList,
            QItem,
            QItemLabel
          },
          methods: {
            removePopup () { removePopup() },
            launch (launchIdx) { that.$emit('launch', that.launches[launchIdx]) }
          }
        })

        this.$nextTick(() => {
          const p = new Popup({
            propsData: {
              data: this.data,
              m: this.m
            }
          }).$mount()
          document.getElementById(popupId).appendChild(p.$el)
        })

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
          if (this.label) canvas.style.cursor = 'pointer'
        })
      }

      map.on('click', this.markerId, () => {
        if (this.label) addPopup()
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
    } // onUp
  } // methods
} // export default

function setMarker (map, id, centre, colour, showMarker) {
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
    filter: ['==', '$type', 'Point'],
    layout: {
      visibility: showMarker ? 'visible' : 'none'
    }
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

function getPopupTemplate (label, launches) {
  return `<q-card flat style="min-width: 80px;">
    <q-card-actions class="q-pa-sm" align="right">
        <q-btn round dense unelevated icon="close" class="btn-close" size="xs" @click="removePopup()"/>
    </q-card-actions>

    <q-card-section class="q-py-none q-px-sm">${label.map(l => `<div>${l}</div>`).join('')}</q-card-section>

    <q-card-actions class="q-pa-sm" align="right">${launches}</q-card-actions>
  </q-card>`
} // getPopupTemplate

function getPopupLaunches (launches) {
  if (launches && Array.isArray(launches) && launches.length) {
    let i = 0

    const items = launches.filter(l => l.title).map(l => {
      const click = `launch(${i})`
      i++
      return `<q-item clickable class="q-pa-md" @click="${click}">
        <q-item-label>
          ${l.title}
        </q-item-label>
      </q-item>`
    })

    return `<q-btn round dense unelevated icon="more_vert" class="btn-primary">
      <q-menu auto-close>
        <q-list style="min-width: 100px" link>${items}</q-list>
      </q-menu>
    </q-btn>`
  }

  return ''
} // getPopupLaunches

</script>
