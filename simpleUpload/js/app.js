var m2c = {
  mapillaryKey: 'WHZlUV9FNXhFZ24xZEZQRHZzUlZ3QTo1NDRmYjUwNzg1NGMxMWFi',
  mapzenKey: 'mapzen-EQXf9MJ',
  mapillaryEndpoint: 'https://a.mapillary.com/v3/',
  mapillaryImageEndpoint: 'https://d1cuyjsrcm0gby.cloudfront.net/',
  mapzenEndpoint: 'https://search.mapzen.com/v1/',
  urlToCommonsEndpoint: 'https://tools.wmflabs.org/url2commons/index.html?run=1',
  commonsEndpoint: 'https://commons.wikimedia.org/w/api.php?action=query&format=json&utf8=1&formatversion=2&origin=*',
  commonsFileEndpoint: 'https://commons.wikimedia.org/wiki/',
  imageData: undefined,

  mapillaryInCommons: function(id, callback) {
    var url = m2c.commonsEndpoint + '&list=search&srsearch=' + id + '&srnamespace=6&srlimit=1&srinfo=&srprop=';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        var response = JSON.parse(xhr.responseText);
        if (typeof callback == 'function') {
          if (response.query.search.length > 0) {
            callback.apply(null, [[true, response.query.search[0].title]]);
          } else {
            callback.apply(null, [[false]]);
          }
        }
      } else {
        return;
      }
    };
    xhr.send();
  },

  getMapillaryFromURL: function() {
    var url = window.location.search.substring(1);
    var vars = url.split('&');
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (pair[0].toLowerCase() == 'mapillary') {
        return pair[1];
      }
    }
    return false;
  },

  mapillaryURLtoID: function(url) {
    if (typeof url == 'string') {
      if (url.match(/\/\/www\.mapillary\.com\/map\/im\//gi)) {
        return decodeURIComponent(url.split('/im/')[1]);
      } else {
        return url;
      }
    } else {
      return false;
    }
  },

  getMapillaryData: function(id, callback) {
    var url = m2c.mapillaryEndpoint + 'images/' + id + '?client_id=' + m2c.mapillaryKey;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        var response = JSON.parse(xhr.responseText);
        if (typeof callback == 'function') {
          if (xhr.status === 404) {
            callback.apply(null, [false]);
          } else {
            m2c.imageData = response;
            callback.apply(null, [response]);
          }
        }
      } else {
        return;
      }
    };
    xhr.send();
  },

  constructURL: function(location, filename) {
    var date = new Date(m2c.imageData.properties.captured_at).toISOString().replace(/T/g, ' ').replace(/.000Z/g, '');
    var imageUrl = m2c.mapillaryImageEndpoint + m2c.imageData.properties.key + '/thumb-2048.jpg';

    var uploadDescription = '{{subst:Mapillary' +
      '|location=' + location +
      '|key=' + m2c.imageData.properties.key +
      '|date=' + date +
      '|username=' + m2c.imageData.properties.username +
      '|lat=' + m2c.imageData.geometry.coordinates[1] +
      '|lon=' + m2c.imageData.geometry.coordinates[0] +
      '|ca=' + m2c.imageData.properties.ca +
      '}}';

    var url = m2c.urlToCommonsEndpoint +
      '&urls=' +
      imageUrl.replace(/_/g, '$US$') +
      ' ' + filename + '|' +
      encodeURIComponent(uploadDescription).replace( /_/g , "$US$" ) +
      '&desc=$DESCRIPTOR$';

    document.getElementById('upload').href = url;
  },

  getMapzenLocation: function(location, callback) {
    var url = m2c.mapzenEndpoint +
      'reverse?api_key=' +
      m2c.mapzenKey +
      '&point.lat=' +
      location[1] +
      '&point.lon=' +
      location[0] +
      '&size=1';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        var response = JSON.parse(xhr.responseText);
        var local;
        if (!response.features[0].properties.locality) {
          local = response.features[0].properties.region;
        } else {
          local = response.features[0].properties.locality;
        }

        var locString = local + ', ' + response.features[0].properties.country;
        if (typeof callback == 'function') {
          callback.apply(null, [locString]);
        }
      } else {
        return;
      }
    };
    xhr.send();
  },

  constructFilename: function(location, id) {
    // expect location to be more then 3 charters long
    if (location.length > 3) {
      var destFile = location + ' - Mapillary (' + id + ').jpg';
      document.getElementById('filename-label').innerText = destFile;
      m2c.constructURL(location, destFile);
    }
  },

  loadMapillaryImage: function(id, callback) {
    var url = m2c.mapillaryImageEndpoint + id + '/thumb-2048.jpg';
    var img = new Image();
    img.onload = callback.apply(null, [url]);
    img.src = url;
  },

  openNotification: function(text) {
    var container = document.getElementById('notification');
    container.innerHTML = text;
    container.style.display = 'inline';

    window.setTimeout(function() {
      container.style.display = 'none';
    }, 6000);
  }
}

var id = m2c.mapillaryURLtoID(m2c.getMapillaryFromURL());

if (id) {
  processImageID(id);
} else {
  var btn = document.getElementById('mapillary-submit');
  var input = document.getElementById('mapillary-input');
  input.style.display = 'inline-block';
  btn.style.display = 'inline-block';

  btn.addEventListener('click', function(evt) {
    id = m2c.mapillaryURLtoID(input.value);
    processImageID(id);
  });
}

document.getElementById('location-input').addEventListener('input', function(evt) {
  m2c.constructFilename(this.value, id);
});

function processImageID(id) {
  m2c.getMapillaryData(id, function(data) {
    if (data) {
      m2c.mapillaryInCommons(id, function(commons) {
        if (!commons[0]) {
          m2c.getMapzenLocation(data.geometry.coordinates, function(location) {

            document.getElementById('location-input').value = location;
            var evt = document.createEvent('HTMLEvents');
            evt.initEvent('input', false, true);
            document.getElementById('location-input').dispatchEvent(evt);

            m2c.loadMapillaryImage(id, function(url) {
              if (typeof url === 'string') {
                document.getElementById('image').src = url;
                document.getElementById('main').style.display = 'flex';
                window.scrollTo(0, document.body.scrollHeight);
              }
            });
          });
        } else {
          m2c.openNotification('This image seams to exist in Commons: <a href="' + m2c.commonsFileEndpoint + commons[1] + '">' + commons[1] + '</a>');
        }
      });
    } else {
      m2c.openNotification('Could not find the requested image at Mapillary.');
    }
  });
}
