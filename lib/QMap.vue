<template>
  <div>
    <q-card class="q-mb-md">
      <q-card-section class="q-pa-none">
        <div :style="$q.screen.gt.sm ? `padding: 0px; height: 50vh;` : `padding: 0px; height: 300px;`">
          <div id="map" style="top: 0; bottom: 0; height: 100%; width: 100%;"></div>
          <slot></slot>
        </div>
      </q-card-section>

      <q-card-actions align="around">
        <!--<q-toggle-->
          <!--v-model="locked"-->
          <!--checked-icon="lock"-->
          <!--unchecked-icon="lock_open"-->
          <!--color="primary"-->
          <!--@input="render"-->
          <!--class="q-mr-md"-->
        <!--/>-->

        <q-btn-toggle
                v-model="mode"
                :options="modeOptions"
                toggle-color="primary"
                size="sm"
                @input="render"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script>
import mapboxgl from 'mapbox-gl'
import QMapCircle from './QMapCircle'

export default {
  name: 'Q-Map',
  components: { QMapCircle },
  props: [
    'defaultCentreToGeolocation',
    'centre-longitude',
    'centre-latitude',
    'locked',
    'id'
  ],
  data () {
    return {
      ready: false,
      map: null,
      mode: 'streets',
      modeOptions: [
        { label: 'Streets', value: 'streets' },
        { label: 'Satellite', value: 'satellite' },
        { label: '3D Buildings', value: '3d' }
      ]
    }
  }, // data
  async mounted () {
    this.ensureMapboxCss()
    this.ensureMapboxJs()

    this.components = findComponents(this)

    this.ready = true
    await this.render()

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
    ensureMapboxCss () {
      const exists = document.getElementById('MAPBOX_CSS_SCRIPT')

      if (!exists) {
        const mapboxglCss = document.createElement('link')
        mapboxglCss.type = 'text/css'
        mapboxglCss.rel = 'stylesheet'
        mapboxglCss.href = `https://api.mapbox.com/mapbox-gl-js/v${mapboxgl.version}/mapbox-gl.css`

        document.head.appendChild(mapboxglCss)
      }
    },
    ensureMapboxJs () {
      const exists = document.getElementById('MAPBOX_JS_SCRIPT')

      if (!exists) {
        const mapboxglJs = document.createElement('script')
        mapboxglJs.id = 'MAPBOX_JS_SCRIPT'
        mapboxglJs.src = `https://api.mapbox.com/mapbox-gl-js/v${mapboxgl.version}/mapbox-gl.js`

        document.head.appendChild(mapboxglJs)
      }
    },
    onLoad () {
      this.map.locked = this.locked
      this.components.forEach(s => {
        s.onLoad && s.onLoad(this.map)
      })
    }, // onLoad
    async mapOptions () {
      const [centre, bounds] = await findCentre(this, this.components)

      const options = {
        container: 'map', // container id
        center: centre,
        bounds: bounds,
        fitBoundsOptions: {padding: 20},
        interactive: !this.locked,
        zoom: 16
      }

      if (this.defaultCentreToGeolocation) {
        options.zoom = 9
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
    async render () {
      if (this.ready) {
        this.destroyMap()

        mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN

        const options = await this.mapOptions()
        this.map = new mapboxgl.Map(options)

        this.navigationControl = new mapboxgl.NavigationControl({ showCompass: false })
        this.map.addControl(this.navigationControl)

        this.map.on('load', () => this.onLoad())
      }
    }
  } // methods
} // ...

async function findCentre (qmap, components) {
  if (qmap.defaultCentreToGeolocation) {
    const position = await getCurrentPosition()
    const { latitude, longitude } = position.coords
    return [[longitude, latitude], null]
  }

  if (qmap.centreLongitude && qmap.centreLatitude) {
    return [[qmap.centreLongitude, qmap.centreLatitude], null]
  }

  const allPositions = components
    .filter(c => c.show)
    .map(c => c.position)
    .filter(p => p)


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

function getCurrentPosition (options = {}) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}
</script>

