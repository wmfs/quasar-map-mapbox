<template>
  <div>
    <div
      :style="$q.screen.gt.sm ? `padding: 0px; height: 50vh;` : `padding: 0px; height: 300px;`"
    >
      <div id="map"></div>
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
  #map {
    top: 0;
    bottom: 0;
    height: 100%;
    width: 100%;
  }

  @import url(https://api.mapbox.com/mapbox-gl-js/v0.53.1/mapbox-gl.css);
</style>

<script>
import mapboxgl from 'mapbox-gl'
import QMapCircle from './QMapCircle'

export default {
  name: 'Q-Map',
  components: { QMapCircle },
  props: [
    'centre-longitude',
    'centre-latitude',
    'locked',
    'id'
  ],
  data () {
    return {
      ready: false,
      map: null,
      mode: 'streets'
    }
  }, // data
  mounted () {
    this.components = findComponents(this)

    this.ready = true
    this.render()

    this.$root.$on('MAP_FLY_TO', ({ id, options }) => {
      if (this.id === id && this.map) {
        this.map.flyTo(options)
      }
    })
  }, // mounted
  beforeDestroy () {
    this.destroyMap()
  }, // beforeDestroy
  methods: {
    onLoad () {
      this.map.locked = this.locked
      this.components.forEach(s => {
        s.onLoad && s.onLoad(this.map)
      })
    }, // onLoad
    mapOptions () {
      const [centre, bounds] = findCentre(this, this.components)

      const options = {
        container: 'map', // container id
        center: centre,
        bounds: bounds,
        fitBoundsOptions: {padding: 20},
        interactive: !this.locked,
        zoom: 16
      }

      switch (this.mode) {
        case 'streets':
          options.style = 'mapbox://styles/mapbox/streets-v11'
          break
        case 'satellite':
          options.style = 'mapbox://styles/mapbox/satellite-streets-v10'
          break
        case '3d':
          options.style = 'mapbox://styles/mapbox/light-v9'
          options.pitch = 45
          options.bearing = -17.6
          break
      }

      return options
    }, // mapOptions
    destroyMap () {
      if (!this.map) return

      if (this.navigationControl) this.map.removeControl(this.navigationControl)
      this.map.remove()
      this.map = null

      this.$root.$off('MAP_FLY_TO')
    }, // destroyMap
    render () {
      if (this.ready) {
        this.destroyMap()

        mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN

        const options = this.mapOptions()
        this.map = new mapboxgl.Map(options)

        this.navigationControl = new mapboxgl.NavigationControl({ showCompass: false })
        this.map.addControl(this.navigationControl)

        this.map.on('load', () => this.onLoad())
      }
    }
  } // methods
} // ...

function findCentre (qmap, components) {
  if (qmap.centreLongitude && qmap.centreLatitude) {
    return [[qmap.centreLongitude, qmap.centreLatitude], null]
  }

  const allPositions = components
    .map(c => c.position)
    .filter(c => c)

  if (allPositions.length) {
    if (allPositions.length === 1) {
      return [allPositions[0], null]
    }

    return [
      allPositions[0],
      bounds(allPositions)
    ]
  } // have components

  return [[0, 0], null]
} // findCentre

function findComponents (qmap) {
  if (!qmap.$slots || !qmap.$slots.default) return []

  return qmap.$slots.default
    .map(c => c.componentInstance)
    .filter(c => c)
} // findComponents

function bounds (allPositions) {
  return [
    minOf(allPositions, 0), minOf(allPositions, 1),
    maxOf(allPositions, 0), maxOf(allPositions, 1)
  ]
} // bounds

function minOf(allPositions, index) {
  return findOf(allPositions, index, Math.min)
} // minOf

function maxOf(allPositions, index) {
  return findOf(allPositions, index, Math.max)
} // maxOf

function findOf(allPositions, index, fn) {
  const p = allPositions
    .map(p => p[index])
    .map(p => Number(p))
  return fn(...p)
} // findOf
</script>

