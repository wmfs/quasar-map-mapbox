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
    'locked'
  ],
  data () {
    const centre = [this.centreLongitude, this.centreLatitude]

    return {
      ready: false,
      map: null,
      mode: 'streets',
      mapCentre: centre,
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
      if (!this.$slots.default) return
      this.$slots.default.forEach(s => {
        const onLoad = s.componentInstance && s.componentInstance.onLoad

        if (onLoad) {
          onLoad(this.map)
        }
      })
    }, // onLoad
    onClick (evt) {
      const { lng, lat } = evt.lngLat

      this.$slots.default.forEach(s => {
        const { isHit, onClick }= s.componentInstance
        if (isHit && isHit(lng, lat)) {
          onClick(lng, lat)
        }
      })
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
    }
  } // methods
} // ...

</script>

