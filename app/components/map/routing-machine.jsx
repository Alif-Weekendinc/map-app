import L from 'leaflet';
import { createControlComponent } from '@react-leaflet/core';
import 'leaflet-routing-machine';
import "leaflet-control-geocoder/dist/Control.Geocoder.js";


const createRoutineMachineLayer = (props) => {
  const instance = L.Routing.control({
    waypoints: [
    ...props.waypoints
    ],
    lineOptions: {
      styles: [{ color: '#6FA1EC', weight: 10 }],
    },
    altLineOptions:{
        styles: [{ color: '#cecece', weight: 10 }],
    },
    show: false,
    addWaypoints: false,
    routeWhileDragging: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
    showAlternatives: true,
    geocoder: L.Control.Geocoder.nominatim(),

  });

  return instance;
};

const RoutingMachine = createControlComponent(createRoutineMachineLayer);

export default RoutingMachine;
