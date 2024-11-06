import React, { useState } from 'react';
import {
  Circle,
  Marker,
  Pane,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';

const MapMarker = ({ startPosition }) => {
  const [position, setPosition] = useState(null);

  const map = useMapEvents({
    click() {
      map.locate();
    },
    locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return (
    <>
      <Marker position={position || startPosition}>
        <Popup>
          A pretty CSS3 popup. <br /> Easily customizable.
        </Popup>
        <Pane name='custom' style={{ zIndex: 100 }}>
          <Circle center={[51.505, -0.09]} radius={200} />
        </Pane>
      </Marker>
      <div className='rounded-l-[8px] w-[400px] h-[50px] bg-black absolute z-[999] right-0 bottom-0 flex items-center'>
        {/* <button className='py-[10px] px-[20px]' onClick={handleCenter}>Center</button> */}
      </div>
    </>
  );
};

export default MapMarker;
