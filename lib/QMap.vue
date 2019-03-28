<template>
  <div>
    <div
      :style="$q.screen.gt.sm ? `padding: 0px; height: 50vh;` : `padding: 0px; height: 300px;`"
    >
      <div id="map"></div>
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
import template from 'lodash.template'

const locationColour = '#2222B4'
const prevLocationColour = '#6666D8'

export default {
  name: 'Q-Map',
  props: [
    'centre-longitude',
    'centre-latitude',
    'centre-show',
    'longitude',
    'latitude',
    'locked'
  ],
  data () {
    const templCentre = [this.centreLongitude, this.centreLatitude]
    const model = this.$vnode.data.model
    const centre = templCentre.map(c => evalTemplate(c, { [model.expression]: model.value }))
    const showCentre = (this.centreShow !== 'false')

    return {
      ready: false,
      map: null,
      mode: 'streets',
      mapCentre: centre,
      centreMarker: showCentre,
      model: model.value
    }
  }, // data
  mounted () {
    this.ready = true
    this.render()
  }, // mounted
  beforeDestroy () {
    this.destroyMap()
  }, // beforeDestroy
  methods: {
    onLoad () {
      this.addMarker('address', this.mapCentre, locationColour, this.centreMarker)

      this.map.on('click', evt => this.onClick(evt))
    }, // onLoad
    onClick (evt) {
      const { lng, lat } = evt.lngLat

      if (this.longitude) {
        this.model[this.longitude] = lng
      }
      if (this.latitude) {
        this.model[this.latitude] = lat
      }

      this.addMarker('address', this.mapCentre, prevLocationColour, this.centreMarker)
      this.addMarker('clicked', [lng, lat], locationColour)
    },
    mapOptions () {
      const options = {
        container: 'map', // container id
        center: this.mapCentre,
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
    }, // render
    addMarker (id, centre, colour, condition = true) {
      if (!condition) return

      if (this.map.getLayer(id)) {
        this.map.removeLayer(id)
        this.map.removeSource(id)
      }

      this.map.addSource(id, {
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

      this.map.addLayer(markerLayer)
    } // addMarker
  } // methods
} // ...

function evalTemplate (temp, data) {
  const compiled = template(
    temp,
    {
      interpolate: /{{([\s\S]+?)}}/g
    }
  )
  return compiled(data)
} // evalTemplate

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

