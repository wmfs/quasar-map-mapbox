# quasar-map-mapbox

[![Tymly Cardscript](https://img.shields.io/badge/tymly-cardscript-blue.svg)](https://tymly.io/)
[![Build Status](https://travis-ci.com/wmfs/quasar-map-mapbox.svg?branch=master)](https://travis-ci.com/wmfs/quasar-map-mapbox)
[![npm (scoped)](https://img.shields.io/npm/v/@wmfs/quasar-map-mapbox.svg)](https://www.npmjs.com/package/@wmfs/quasar-map-mapbox) 
[![Dependabot badge](https://img.shields.io/badge/Dependabot-active-brightgreen.svg)](https://dependabot.com/) 
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) 
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) 
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/concrete-paths/LICENSE)

> MapBox wrapped as a Quasar Component

## <a name="install"></a>Install
```bash
$ npm install @wmfs/quasar-map-mapbox --save
```

## <a name="usage"></a>Usage

```
<template>
  <q-map
    centre-latitude=...  // initial centre
    centre-longitude=... 
    centre-show=...      // false|true, draw marker to show centre
    ...
    />
</template>
<script>
import QMap from '@wmfs/quasar-map-mapbox'

export default {
  ...
  components: { QMap, ... }
  ...
}
</script>
```
Defined the MAPBOX_ACCESS_TOKEN environment variable at build time.


## <a name="license"></a>License
[MIT](https://github.com/wmfs/quasar-map-mapbox/blob/master/LICENSE)
