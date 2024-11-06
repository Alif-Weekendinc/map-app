'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
const position = [51.505, -0.09];
import L, { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.js';
import RoutingMachine from './routing-machine';
import GeoCoder from './geocoder';
import SearchGeo from './search-geo';

const MapLeaf = () => {
  const [startingPoint, setStartingPoint] = useState(position);

  return (
    <MapContainer
      className='w-[100dvw] h-[100dvh]'
      center={startingPoint}
      zoom={13}
      scrollWheelZoom={true}
      zoomControl={false}
    >
      <MapChildren position={startingPoint} setPosition={setStartingPoint} />
      {/* <RoutingForm /> */}
    </MapContainer>
  );
};

function MapChildren({ position, setPosition }) {
  const init = useRef(false);
  const generateStyle = (color) => {
    return `
  background-color: ${color};
  width: 3rem;
  height: 3rem;
  display: block;
  left: -1.5rem;
  top: -1.5rem;
  position: relative;
  border-radius: 3rem 3rem 0;
  transform: rotate(45deg);
  border: 1px solid #FFFFFF`;
  };

  const map = useMap();
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [isShowPath, setIsShowPath] = useState(false);
  const generatedRoutesRef = useRef(null);
  const circleRef = useRef(null)
  const [markers, setMarkers] = useState([
    {
      id: 1,
      name: 'Point 1',
      geometry_coordinates: position,
      draggable: false,
      color: 'blue',
    },
  ]);

  const eventHandlers = useMemo(
    () => ({
      dragend(e) {
        // console.log(e.target._latlng, selectedMarkerId);
        let MappedMarker = markers.map((mark) => {
          if (mark.id !== selectedMarkerId) return mark;
          else {
            return {
              ...mark,
              geometry_coordinates: [
                e.target._latlng.lat,
                e.target._latlng.lng,
              ],
              draggable: false,
            };
          }
        });
        // console.log(MappedMarker);
        setMarkers(MappedMarker);
      },
    }),
    [selectedMarkerId]
  );

  const handleDrag = (e, id) => {
    // console.log(e, id);
    let MappedMarker = markers.map((mark) => {
      if (mark.id !== id) return mark;
      else {
        if (mark.draggable) setSelectedMarkerId(null);
        else setSelectedMarkerId(id);
        return { ...mark, draggable: !mark.draggable };
      }
    });
    // console.log(MappedMarker);
    setMarkers(MappedMarker);
  };

  const handleAddMarker = (e, newPos = position) => {
    const newObj = {
      id: markers.length + 1,
      name: `Point ${markers.length + 1}`,
      geometry_coordinates: newPos,
      draggable: false,
      color:
        '#' + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0'),
    };
    let newArr = [...markers, newObj];
    // console.log();
    setIsShowPath(false);
    setMarkers(newArr);
  };

  const handleRemoveMarker = (e, id) => {
    // console.log('click', id);
    if (!id) {
      // console.log('hrer');
      if (markers.length < 1) return;
      let newArr = [...markers];
      newArr.pop();
      // console.log(newArr);
      setMarkers(newArr);
    } else {
      // console.log('hrerss');
      let newArr = markers.filter((mark) => mark.id !== id);
      setMarkers(newArr);
    }
  };

  const handleCenter = (_, isInit = false, pos = null) => {
    console.log(isInit, pos);
    if (pos) {
      setPosition(pos);
      map.flyTo(pos, map.getZoom());
    } else {
      console.log('here', isInit);
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        console.log(pos, 'latling', isInit);
        if (isInit) {
          console.log(isInit, 'ini');
          let mapMarkers = {
            ...markers[0],
            geometry_coordinates: [pos.coords.latitude, pos.coords.longitude],
          };
          setMarkers([mapMarkers]);
          setIsShowPath(false);
        }
        if(circleRef.current)
        map.removeLayer(circleRef.current)
        map.flyTo({ lat: pos.coords.latitude, lng: pos.coords.longitude }, map.getZoom());
        const radius = pos.coords.accuracy;
        const circle = L.circle({ lat: pos.coords.latitude, lng: pos.coords.longitude }, radius);
        circleRef.current = circle
        circle.addTo(map);
      });
      // map
      //   .locate({ enableHighAccuracy: true })
      //   .on('locationfound', function (e) {
      //     console.log('here', isInit, e);
      //     setPosition(e.latlng);
      //     console.log(e.latlng, 'latling', isInit);
      //     if (isInit) {
      //       console.log(isInit, 'ini');
      //       let mapMarkers = {
      //         ...markers[0],
      //         geometry_coordinates: [e.latlng.lat, e.latlng.lng],
      //       };
      //       setMarkers([mapMarkers]);
      //       setIsShowPath(false);
      //     }
      //     map.flyTo(e.latlng, map.getZoom());
      //     const radius = e.accuracy;
      //     const circle = L.circle(e.latlng, radius);
      //     circle.addTo(map);
      //     // setBbox(e.bounds.toBBoxString().split(","));
      //   });
      // return;
    }
  };

  const mapEvent = useMapEvents({
    dblclick(e) {
      // console.log(e, 'evenet')
      handleAddMarker(e, [e.latlng.lat, e.latlng.lng]);
    },
    // locationfound(e) {
    //   setPosition(e.latlng);
    //   map.flyTo(e.latlng, map.getZoom());
    // },
  });

  useEffect(() => {
    // if (!init.current) {
    // }
    // init.current = true;

    if (isShowPath) {
      let newWaypoints = markers.map((mark) =>
        L.latLng(mark.geometry_coordinates[0], mark.geometry_coordinates[1])
      );

      generatedRoutesRef.current = L.Routing.control({
        waypoints: [...newWaypoints],
        waypointNameFallback: function (latLng) {
          function zeroPad(n) {
            n = Math.round(n);
            return n < 10 ? '0' + n : n;
          }
          function sexagesimal(p, pos, neg) {
            let n = Math.abs(p),
              degs = Math.floor(n),
              mins = (n - degs) * 60,
              secs = (mins - Math.floor(mins)) * 60,
              frac = Math.round((secs - Math.floor(secs)) * 100);
            return (
              (n >= 0 ? pos : neg) +
              degs +
              '°' +
              zeroPad(mins) +
              "'" +
              zeroPad(secs) +
              '.' +
              zeroPad(frac) +
              '"'
            );
          }

          return (
            sexagesimal(latLng.lat, 'N', 'S') +
            ' ' +
            sexagesimal(latLng.lng, 'E', 'W')
          );
        },
        lineOptions: {
          styles: [{ color: '#6FA1EC', weight: 10 }],
        },
        altLineOptions: {
          styles: [{ color: '#cecece', weight: 10 }],
        },
        show: true,
        addWaypoints: false,
        routeWhileDragging: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: true,
        geocoder: L.Control.Geocoder.nominatim(),
        createMarker: function () {
          return null;
        },
      }).addTo(map);
    }

    return () => {
      if (generatedRoutesRef.current) {
        generatedRoutesRef.current.remove();
      }
    };
  }, [markers, isShowPath]);

  useEffect(() => {
    L.control
    .zoom({
      position: 'topright',
    })
    .addTo(map);

    if (navigator) {
      console.log('re');
      // navigator.geolocation.getCurrentPosition((pos) => {
      handleCenter(null, true);
      // });
    }
  }, []);

  // const handleStartRoute = () => {
  //   if (generatedRoutesRef.current) generatedRoutesRef.current.remove();
  //   let newWaypoints = markers.map((mark) =>
  //     L.latLng(mark.geometry_coordinates[0], mark.geometry_coordinates[1])
  //   );
  //   console.log(newWaypoints);
  //   generatedRoutesRef.current = L.Routing.control({
  //     waypoints: [...newWaypoints],
  //     waypointNameFallback: function (latLng) {
  //       function zeroPad(n) {
  //         n = Math.round(n);
  //         return n < 10 ? '0' + n : n;
  //       }
  //       function sexagesimal(p, pos, neg) {
  //         let n = Math.abs(p),
  //           degs = Math.floor(n),
  //           mins = (n - degs) * 60,
  //           secs = (mins - Math.floor(mins)) * 60,
  //           frac = Math.round((secs - Math.floor(secs)) * 100);
  //         return (
  //           (n >= 0 ? pos : neg) +
  //           degs +
  //           '°' +
  //           zeroPad(mins) +
  //           "'" +
  //           zeroPad(secs) +
  //           '.' +
  //           zeroPad(frac) +
  //           '"'
  //         );
  //       }

  //       return (
  //         sexagesimal(latLng.lat, 'N', 'S') +
  //         ' ' +
  //         sexagesimal(latLng.lng, 'E', 'W')
  //       );
  //     },
  //     lineOptions: {
  //       styles: [{ color: '#6FA1EC', weight: 10 }],
  //     },
  //     altLineOptions: {
  //       styles: [{ color: '#cecece', weight: 10 }],
  //     },
  //     show: true,
  //     addWaypoints: false,
  //     routeWhileDragging: false,
  //     draggableWaypoints: false,
  //     fitSelectedRoutes: true,
  //     showAlternatives: true,
  //     geocoder: L.Control.Geocoder.nominatim(),
  //     createMarker: function () {
  //       return null;
  //     },
  //   }).addTo(map);
  // };
  // useEffect(() => {
  //   let geocoder = L.Control.Geocoder.nominatim();
  //   if (typeof URLSearchParams !== 'undefined' && location.search) {
  //     // parse /?geocoder=nominatim from URL
  //     let params = new URLSearchParams(location.search);
  //     let geocoderString = params.get('geocoder');
  //     if (geocoderString && L.Control.Geocoder[geocoderString]) {
  //       geocoder = L.Control.Geocoder[geocoderString]();
  //     } else if (geocoderString) {
  //       console.warn('Unsupported geocoder', geocoderString);
  //     }
  //   }

  //   L.Control.geocoder({
  //     query: '',
  //     placeholder: 'Search here...',
  //     defaultMarkGeocode: false,
  //     geocoder,
  //   })
  //     .on('markgeocode', function (e) {
  //       let latlng = e.geocode.center;
  //       L.marker(latlng)
  //         .addTo(map)
  //         .bindPopup(e.geocode.name)
  //         .openPopup();
  //       map.fitBounds(e.geocode.bbox);
  //     })
  //     .addTo(map);
  // }, []);

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {/* <GeoCoder /> */}
      <SearchGeo handleCenter={handleCenter} />
      {/* {isShowPath && (
        <RoutingMachine
          waypoints={markers.map((mark) => ({
            lat: mark.geometry_coordinates[0],
            lng: mark.geometry_coordinates[1],
          }))}
        />
      )} */}
      {markers.map((mark, index) => (
        <Marker
          key={mark.id}
          position={[
            mark.geometry_coordinates[0],
            mark.geometry_coordinates[1],
          ]}
          draggable={mark.draggable}
          eventHandlers={eventHandlers}
          icon={
            new L.divIcon({
              // iconUrl:'',
              className: 'my-custom-pin',
              iconAnchor: [0, 24],
              labelAnchor: [-6, 0],
              popupAnchor: [0, -36],
              html: `<span style="${generateStyle(mark.color)}" />`,
            })
          }
        >
          <Popup>
            <div className='flex items-center justify-between'>
              {mark.name}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveMarker(e, mark.id);
                }}
                id={`mark-${mark.id}`}
              >
                Delete Marker
              </button>
            </div>
            <br />
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleDrag(e, mark.id);
              }}
            >
              {mark.draggable
                ? ' Marker is draggable'
                : ' Click here to make marker draggable'}
            </span>

            {/* {mark.name} */}
          </Popup>
        </Marker>
      ))}
      <div className='rounded-l-[8px] w-[50px] h-[50dvh]  absolute z-[999] left-0 bottom-[20px] flex flex-col gap-[10px] items-center justify-center'>
        {/* <button className='py-[10px] px-[20px]' onClick={handleCenter}>Center</button> */}
        <div
          className='py-[10px] px-[20px] bg-black rounded-[5px] text-white'
          onClick={(e) => {
            e.stopPropagation();
            handleAddMarker(e);
          }}
        >
          +
        </div>
        <div
          className='py-[10px] px-[20px] bg-black rounded-[5px] text-white'
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveMarker(e);
          }}
        >
          -
        </div>
        <div
          className='py-[10px] px-[20px] bg-black rounded-[5px] text-white'
          onClick={(e) => {
            e.stopPropagation();
            handleCenter(e, false);
          }}
        >
          C
        </div>
        {/* {markers.length > 1 && ( */}
        <div
          className='py-[10px] px-[20px] bg-black rounded-[5px] text-white'
          onClick={(e) => {
            e.stopPropagation();
            setIsShowPath(!isShowPath);
          }}
        >
          P
        </div>
        {/* )} */}
      </div>
    </>
  );
}

export default MapLeaf;
