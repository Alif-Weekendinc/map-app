import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

const SearchGeo = ({ handleCenter }) => {
  const map = useMap();
  const init = useRef(false);
  useEffect(() => {
    // if (!init.current) {
      let geocoder = L.Control.geocoder({
        query: '',
        placeholder: 'Search here...',
        defaultMarkGeocode: false,
      })
        .on('markgeocode', function (e) {
          console.log(e);
          handleCenter(null, false, [e.geocode.center.lat, e.geocode.center.lng]);
        })
        .addTo(map);
    // }
    // init.current = true;
  }, []);
};

export default SearchGeo;
