import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

const SearchGeo = ({ handleCenter }) => {
  const map = useMap();
  const init = useRef(false);
  useEffect(() => {
    // if (!init.current) {
      let geocoder = L.Control.geocoder({
        defaultMarkGeocode: false,
      })
        .on('markgeocode', function (e) {
          console.log(e);
          handleCenter(null, false, [e.geocode.center.lat, e.geocode.center.lng]);
        })
        .addTo(map);

        geocoder.getContainer().style.display = 'none'
    // }
    // init.current = true;
  }, []);
};

export default SearchGeo;
