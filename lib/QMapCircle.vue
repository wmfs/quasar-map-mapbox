<script>
/* eslint-disable */
import { throttle } from 'quasar'
import OsGridRef, { LatLon } from 'geodesy/osgridref.js'
import { v4 as uuidv4 } from 'uuid'
import findPosition from './find-position'

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
    'locked'
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
  methods: {
    onLoad (map) {
      setMarker(
          map,
          this.markerId,
          this.position,
          this.markerColour,
          this.showMarker
      )

      // const popup = new mapboxgl.Popup({ closeButton: true, closeOnMove: true })
      // const canvas = map.getCanvasContainer()
      //
      // popup.on('close', () => {
      //   this.showingPopup = false
      // })
      //
      // const addPopup = (e) => {
      //   if (this.showingPopup) return
      //
      //   const popupId = `${this.markerId}-popup`
      //   const label = Array.isArray(this.label) ? this.label : [this.label]
      //
      //   popup
      //     .setLngLat(this.position)
      //     .setHTML(`<div id="${popupId}" class="q-map-popup"></div>`)
      //     .addTo(map)
      //
      //   let template = `<div>`
      //   template += label.map(l => `<div>${l}</div>`).join('')
      //   template += `</div>`
      //
      //   // const Popup = Vue.extend({
      //   //   template,
      //   //   props: ['data', 'm']
      //   // })
      //   //
      //   // this.$nextTick(() => {
      //   //   const p = new Popup({
      //   //     propsData: {
      //   //       data: this.data,
      //   //       m: this.m
      //   //     }
      //   //   }).$mount()
      //   //   document.getElementById(popupId).appendChild(p.$el)
      //   // })
      //
      //   this.showingPopup = true
      // }
      //
      // if (!this.locked && !map.locked) {
      //   map.on('mouseenter', this.markerId, () => {
      //     canvas.style.cursor = 'grab'
      //   })
      //   map.on('mousedown', this.markerId, e => {
      //     e.preventDefault()
      //     canvas.style.cursor = 'grabbing'
      //     popup.remove()
      //     const onMove = e => this.onMove(e, map)
      //     map.on('mousemove', onMove)
      //     map.once('mouseup', e => this.onUp(e, map, onMove))
      //   })
      // } else {
      //   map.on('mouseenter', this.markerId, () => {
      //     if (this.label) canvas.style.cursor = 'pointer'
      //   })
      // }
      //
      // map.on('click', this.markerId, (e) => {
      //   if (this.label) addPopup(e)
      // })
      //
      // map.on('mouseleave', this.markerId, () => {
      //   canvas.style.cursor = ''
      // })
    }
  },
  mounted () {
    const map = this.getMapInstance()
    this.onLoad(map)
  },
  render() {
    return null
  }
}

function setMarker (map, id, centre, colour, showMarker) {
  if (!map) {
    return
  }

  console.log('setMarker', id, centre, colour, showMarker)

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

