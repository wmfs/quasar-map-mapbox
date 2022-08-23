<template>
  <q-card class="q-mb-md bg-transparent" flat>
    <q-card-section class="q-pa-none">
      <div :style="$q.screen.gt.sm ? `padding: 0px; height: 50vh;` : `padding: 0px; height: 300px;`">
        <div :id="containerId" style="top: 0; bottom: 0; height: 100%; width: 100%; border-radius: 4px;"></div>
        <slot v-if="mapboxgl && map"></slot>
      </div>
    </q-card-section>

    <q-card-actions align="around">
      <q-btn-toggle
          class="button-toggle"
          v-model="mode"
          :options="modeOptions"
          size="sm"
          @update:model-value="render"
          unelevated
          toggle-color="white"
          toggle-text-color="primary"
          color="light"
          text-color="dark"
          no-caps
      />
    </q-card-actions>
  </q-card>
</template>

<script>
/* eslint-disable vue/no-unused-components */
import { ref } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { v4 as uuidv4 } from 'uuid'
import QMapCircle from './QMapCircle'
import findPosition from './find-position'

export default {
  name: 'QMap',
  props: [
    'defaultCentreToGeolocation',
    'centre-longitude',
    'centre-latitude',
    'locked',
    'draggable',
    'id',
    'mapFlyTo'
  ],
  provide () {
    return {
      getMapInstance: () => ({ map: this.map, mapboxgl: this.mapboxgl })
    }
  },
  components: { QMapCircle },
  setup () {
    return {
      ready: ref(false),
      map: ref(null),
      mapboxgl: ref(null),
      containerId: uuidv4(),
      mode: ref('streets'),
      modeOptions: [
        { label: 'Streets', value: 'streets' },
        { label: 'Satellite', value: 'satellite' },
        { label: '3D Buildings', value: '3d' }
      ]
    }
  },
  data () {
    return {
      components: [],
      center: [0, 0],
      bounds: null
    }
  },
  watch: {
    mapFlyTo: {
      handler (center) {
        if (!this.map) {
          return
        }

        if (!Array.isArray(center)) {
          return
        }

        if (center.length !== 2) {
          return
        }

        this.map.flyTo({ center, zoom: 15 })
      },
      deep: true
    }
  },
  methods: {
    render () {
      if (!this.ready) {
        return
      }

      this.destroyMap()

      this.mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN

      const options = this.mapOptions()

      this.navigationControl = new this.mapboxgl.NavigationControl({ showCompass: false })

      const map = new this.mapboxgl.Map(options)
      map.addControl(this.navigationControl)
      map.locked = this.locked
      map.on('load', () => {
        this.map = map
      })
    },
    destroyMap () {
      if (!this.map) {
        return
      }

      if (this.navigationControl) {
        this.map.removeControl(this.navigationControl)
      }

      this.map.remove()
      this.map = null
    },
    mapOptions () {
      const options = {
        container: this.containerId,
        center: this.center,
        bounds: this.bounds,
        fitBoundsOptions: { padding: 20 },
        interactive: !this.locked ? true : this.draggable,
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
    }
  },
  async mounted () {
    this.mapboxgl = mapboxgl
    this.ready = true
    this.components = findComponents(this.$slots.default())
    const [center, bounds] = await findCentre(this, this.components)
    this.center = center
    this.bounds = bounds
    this.render()
  },
  beforeUnmount () {
    this.destroyMap()
  }
}

function findComponents (defaultSlots) {
  const components = []

  findComponentsIter(defaultSlots, components)

  return components
}

function findComponentsIter (vnodes, components) {
  for (const vnode of vnodes) {
    if (typeof vnode.type !== 'object') {
      if (Array.isArray(vnode.children)) {
        findComponentsIter(vnode.children, components)
      }

      continue
    }

    if (vnode.type.name !== 'QMapCircle') {
      continue
    }

    if (vnode.props.showMarker !== true) {
      continue
    }

    const position = findPosition(vnode.props)
    components.push(position)
  }
}

async function findCentre (qmap, positions) {
  if (positions.length) {
    if (positions.length === 1) {
      return [positions[0], null]
    }

    return [
      positions[0],
      bounds(positions)
    ]
  } else {
    if (qmap.defaultCentreToGeolocation) {
      try {
        const position = await getCurrentPosition()
        const { latitude, longitude } = position.coords
        return [[longitude, latitude], null]
      } catch (err) {
        console.log('error getting geolocation')
      }
    }

    if (qmap.centreLongitude && qmap.centreLatitude) {
      return [[qmap.centreLongitude, qmap.centreLatitude], null]
    }
  }

  return [[0, 0], null]
}

function bounds (positions) {
  return [
    minOf(positions, 0), minOf(positions, 1),
    maxOf(positions, 0), maxOf(positions, 1)
  ]
}

function minOf (positions, index) {
  return findOf(positions, index, Math.min)
}

function maxOf (positions, index) {
  return findOf(positions, index, Math.max)
}

function findOf (positions, index, fn) {
  const p = positions
      .map(p => p[index])
      .map(p => Number(p))
  return fn(...p)
}

function getCurrentPosition (options = {}) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}
</script>
