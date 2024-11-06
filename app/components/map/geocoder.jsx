'use client';
import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.js';

const GeoCoder = ({waypoints}) => {
  const map = useMap();
  const init = useRef(false);
  useEffect(() => {
    if (!init.current)
      L.Routing.control({
        waypoints:  waypoints,
        routeWhileDragging: true,
        useZoomParameter:true,
        showAlternatives:true,
        geocoder: L.Control.Geocoder.nominatim(),

      }).on('routesfound', (e) => console.log(e)).addTo(map);
    init.current = true;
  }, [waypoints]);

};

export default GeoCoder;
