Touch-UI
---------
Fire cross-browser convenient touch events

Tested with
<img src="https://ci.testling.com/_/images/chrome.png" width=32 />
<img src="https://ci.testling.com/_/images/firefox.png" width=32 />
<img src="https://ci.testling.com/_/images/safari.png" width=32 />
<img src="https://ci.testling.com/_/images/iphone.png" width=32 />
<img src="https://ci.testling.com/_/images/ipad.png" width=32 />
<img src="https://ci.testling.com/_/images/android-browser.png" width=32 />

[DEMO](https://rawgit.com/allenhwkim/touch-ui/master/demo.html)

Installation
=============

    npm install touch-ui

Getting Started
===============
First instantiate GeoCoder object with provider information

Example
```
  var geoCoder = new GeoCoder({
    provider: 'google',  // 'osm', or 'bing'
    key: MY_GOOGLE_API_KEY
  });
```

Geocoding Example
=================
```
  geoCoder.geocode('Brampton, Ontario').then(result => {
    console.log('geo lookup result', result);
  })
```

Autocomplete Example
====================
```
  let inputEl = document.querySelector('#autocomplete .address');
  geoCoder.autocomplete(inputEl);
  inputEl.addEventListener('place_changed', (event: any) => {
    console.log('autocomplete result', evnt);
  })
```
Reverse Lookup Example
======================
```
  geoCoder.reverse(43.653226, -79.3831843).then(result => {
    console.log('reverse lookup result', result);
  })
```

Providers
==========
* Google (api key required)
* Bing (api key required)
* OpenStreet


