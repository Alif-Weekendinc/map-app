'use client';
import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
const position = [51.505, -0.09];
import L, { control, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.js';
import RoutingMachine from './routing-machine';
import GeoCoder from './geocoder';
import SearchGeo from './search-geo';
import html2canvas from 'html2canvas-pro';
import leafletImage from 'leaflet-image';
import { usePathname, useSearchParams } from 'next/navigation';

const MapLeaf = () => {
  const [startingPoint, setStartingPoint] = useState(position);
  const mapContainerRef = useRef(null);
  const [imageURL, setImageURL] = useState(null);

  async function toCanvas() {
    // document.querySelector('#action-group').style.display = 'none'
    // document.querySelector('#input-group').style.display = 'none'
    // document.querySelector('#routes').style.display = 'none'
    // if (mapContainerRef.current) {
    //   html2canvas(document.querySelector('.leaflet-container'), {
    //     useCORS: true,
    //     scale: 3,
    //   }).then((canvas) => {
    //     const img = canvas.toDataURL('image/png');
    //     const a = document.createElement('a');
    //     document.body.appendChild(a);
    //     const url = img;
    //     a.href = url;
    //     a.download = 'test.png';
    //     a.click();
    //   });
    // }

    leafletImage(mapContainerRef.current, function (err, canvas) {
      // now you have canvas
      // example thing to do with that canvas:
      // var img = document.createElement('img');
      // var dimensions = mapContainerRef.current.getSize();
      // img.width = dimensions.x;
      // img.height = dimensions.y;
      // img.src = canvas.toDataURL();
      // document.getElementById('images').innerHTML = '';
      // document.getElementById('images').appendChild(img);
      // Get the data URL for the canvas content (in PNG format)
      const dataURL = canvas.toDataURL('image/png');

      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'export.png';

      // Append the link to the body, trigger a click to start the download, and then remove the link
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    // if (mapContainerRef.current) {
    //   document.querySelector('#action-group').style.display = 'none';
    //   document.querySelector('#input-group').style.display = 'none';
    //   document.querySelector('#routes').style.display = 'none';
    //   html2canvas(document.querySelector('.leaflet-container'), {
    //     useCORS: true,
    //   }).then((canvas) => {
    //     const img = canvas.toDataURL('image/png');
    //     let imgEl = document.createElement('img');
    //     let dimensions = mapContainerRef.current.getSize();
    //     imgEl.width = dimensions.x;
    //     imgEl.height = dimensions.y;
    //     imgEl.src = img;
    //     document.getElementById('images').innerHTML = '';
    //     document.getElementById('images').appendChild(imgEl);
    //     document.querySelector('#action-group').style.display = 'flex';
    //     document.querySelector('#input-group').style.display = 'block';
    //     document.querySelector('#routes').style.display = 'block';
    //   });
    // }
  }

  return (
    <MapContainer
      className='w-[100dvw] h-[100dvh]'
      center={startingPoint}
      zoom={13}
      scrollWheelZoom={true}
      zoomControl={false}
      ref={mapContainerRef}
      preferCanvas={true}
      // whenReady={}
    >
      <MapChildren
        toCanvas={toCanvas}
        position={startingPoint}
        setPosition={setStartingPoint}
      />
      <div
        className='absolute z-[999] right-0 bottom-0 w-[300px] h-[300px]'
        id='images'
      >
        {/* <a href={imageURL}>Download</a> */}
      </div>
      {/* <RoutingForm /> */}
    </MapContainer>
  );
};

const startIcon = L.divIcon({
  className: 'leaflet-routing-icon-start',
  html: `<div style="background-color: red; border-radius: 50%; width: 20px; height: 20px;"></div>`,
  iconSize: [20, 20],
});

const pointIcon = L.divIcon({
  className: 'leaflet-routing-icon-end',
  html: `<div style="background-color: blue; border-radius: 50%; width: 20px; height: 20px;"></div>`,
  iconSize: [20, 20],
});
const endIcon = L.divIcon({
  className: 'leaflet-routing-icon-end',
  html: `<div style="background-color: green; border-radius: 50%; width: 20px; height: 20px;"></div>`,
  iconSize: [20, 20],
});

function MapChildren({ position, setPosition, toCanvas }) {
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
  const [geoCode, setGeoCode] = useState(false);
  const [search, setSearch] = useState('');
  const [dataSearch, setDataSearch] = useState([]);
  const [isShowRes, setIsShowRes] = useState(false);
  const [isCreateRoute, setIsCreateRoute] = useState(false);
  const [routes, setRoutes] = useState(['', '']);
  const [lastIndex, setLastIndex] = useState(-1);
  const generatedRoutesRef = useRef(null);
  const circleRef = useRef(null);
  const geocoderRef = useRef(null);
  const reverseBtn = useRef(null);
  const [selectedRoutes, setSelectedRoutes] = useState(0);
  const [userMarker, setUserMarker] = useState(null);
  const [startTrack, setStartTrack] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [markers, setMarkers] = useState([
    {
      id: 1,
      name: 'Point 1',
      geometry_coordinates: position,
      draggable: false,
      color: 'blue',
    },
  ]);
  const [instructions, setInstructions] = useState([]);

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

  const handleAddMarker = (e, newPos = position, indexToChange) => {
    console.log(indexToChange, newPos);
    const newObj = {
      id: markers.length + 1,
      name: `Point ${markers.length + 1}`,
      geometry_coordinates: newPos,
      draggable: false,
      color:
        '#' + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0'),
    };
    let newArr = [];

    if (indexToChange) {
      newArr = markers.map((mark, index) => {
        console.log(index, indexToChange, index !== indexToChange);
        if (index !== indexToChange) {
          return mark;
        } else {
          return newObj;
        }
      });
      console.log(newArr, 'with pos');
    } else {
      newArr = [...markers, newObj];
    }
    setLastIndex(-1);
    console.log(newArr, 'newArr,', markers);
    setMarkers(newArr);
    // console.log();
    // setIsShowPath(false);
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

  const handleCenter = (
    _,
    isInit = false,
    pos = null,
    isSearch = false,
    indexToChange
  ) => {
    console.log(isInit, pos, isSearch, lastIndex);
    if (pos) {
      setPosition(pos);
      // if (isSearch && lastIndex === 0) {
      //   // console.log(isInit, 'ini');
      //   let mapMarkers = {
      //     ...markers[0],
      //     geometry_coordinates: pos,
      //   };
      //   setMarkers([mapMarkers]);
      //   setIsShowPath(false);
      // } else {
      console.log(
        indexToChange,
        indexToChange <= markers.length - 1,
        markers.length
      );
      if (indexToChange <= markers.length - 1) {
        let mappedMarker = [];
        mappedMarker = markers.map((mark, index) => {
          console.log(index, indexToChange, index !== indexToChange);
          if (index !== indexToChange) {
            return mark;
          } else {
            return { ...markers[0], geometry_coordinates: pos };
          }
        });
        setMarkers(mappedMarker);
      } else {
        let newMarker = {
          ...markers[0],
          id: lastIndex + 1,
          name: `Point ${lastIndex + 1}`,
          geometry_coordinates: pos,
        };
        setMarkers([...markers, newMarker]);
      }
      setIsShowPath(false);
      // }
      map.flyTo(pos, map.getZoom());
    } else {
      console.log('here', isInit);
      setSearch('Your Location');
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
        if (circleRef.current) map?.removeLayer(circleRef.current);
        map.flyTo(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          map.getZoom()
        );
        const radius = pos.coords.accuracy;
        const circle = L.circle(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          radius
        );
        circleRef.current = circle;
        circle.addTo(map);
      });
    }
  };

  const mapEvent = useMapEvents({
    // dblclick(e) {
    //   // console.log(e, 'evenet')
    //   handleAddMarker(e, [e.latlng.lat, e.latlng.lng]);
    // },
    // locationfound(e) {
    //   setPosition(e.latlng);
    //   map.flyTo(e.latlng, map.getZoom());
    // },
  });

  function filterWithIndex(arr, callback) {
    return arr.reduce((indices, value, index) => {
      if (callback(value)) {
        indices.push(index);
      }
      return indices;
    }, []);
  }

  function chunkArrayBasedOnBreakpoints(arr, breakPoints) {
    let result = [];
    let startIdx = 0;

    // Iterate through the break points to create chunks
    for (let i = 0; i < breakPoints.length; i++) {
      let endIdx = breakPoints[i];
      result.push(arr.slice(startIdx, endIdx));
      startIdx = endIdx; // Set the start index for the next chunk
    }

    // Handle the remaining elements after the last break point
    if (startIdx < arr.length) {
      result.push(arr.slice(startIdx));
    }

    return result;
  }

  const trackUser = () => {
    console.log('hit');
    navigator.geolocation.getCurrentPosition((pos) => {
      setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      let mapMarkers = {
        ...markers[0],
        geometry_coordinates: [pos.coords.latitude, pos.coords.longitude],
      };
      setUserMarker([mapMarkers]);
      // setIsShowPath(false);
      map.panTo(
        { lat: pos.coords.latitude, lng: pos.coords.longitude }
        // map.getZoom()
      );
    });
  };

  function urlParamsToObject(url) {
    let newArr = [];
    let routesArr = [];
    url.map((urlSeg) => {
      const object = {};
      urlSeg.split('&').map((segment) => {
        let splittedSegment = segment.split('=');
        console.log(
          splittedSegment[1].includes(';'),
          splittedSegment[1].split(';'),
          segment
        );
        if (splittedSegment[1].includes(';')) {
          return (object[splittedSegment[0]] = splittedSegment[1].split(';'));
        } else {
          return (object[splittedSegment[0]] = splittedSegment[1]);
        }
      });
      newArr.push(object);
      routesArr.push(object.geometry_coordinates);
    });

    console.log(newArr, 'object', routesArr);
    setMarkers(newArr);
    setRoutes(routesArr);

    // setTimeout(() => {
    //   console.log('hre')
    if (newArr.length > 1) setIsShowPath(true);
    else {
      console.log(newArr);
      map.flyTo(
        L.latLng(
          newArr[0].geometry_coordinates[0],
          newArr[0].geometry_coordinates[1]
        ),
        map.getZoom()
      );
    }
    // }, 15000);

    //  return params.join('&');
  }

  useEffect(() => {
    if (searchParams.has('routes')) {
      setIsCreateRoute(true);
      let routes = decodeURIComponent(searchParams.get('routes')).split(',');
      console.log(routes, 'routes');
      urlParamsToObject(routes);
    }
  }, [searchParams]);

  useEffect(() => {
    console.log(markers, ',ar');
    let newWaypoints = markers.map(
      (mark) =>
        new L.Routing.Waypoint(
          L.latLng(mark.geometry_coordinates[0], mark.geometry_coordinates[1])
        )
    );

    let reverseFunction = () => {};

    if (isShowPath) {
      if (circleRef.current) map?.removeLayer(circleRef.current);
      let control = L.Routing.control({
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
          styles: [{ color: '#6FA1EC', weight: 10, opacity: 1 }],
        },
        altLineOptions: {
          styles: [{ color: '#cecece', weight: 10, opacity: 1 }],
        },
        show: false,
        addWaypoints: true,
        routeWhileDragging: true,
        draggableWaypoints: true,
        fitSelectedRoutes: true,
        showAlternatives: true,
        geocoder: L.Control.Geocoder.nominatim(),
        reverseWaypoints: true,
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1', // URL of OSRM service
          profile: 'car', // Profile for routing (e.g., car, bike, walking)
          geometries: 'geojson', // Geometry format (can also be polyline)
          steps: true, // Include detailed steps (turn-by-turn directions)
          annotations: true, // Include annotations (e.g., distance, duration for each segment)
          avoid: ['tolls'], // Avoid toll roads (can add other features like ferries or highways)
          radius: 50, // Snap waypoints to road within 50 meters
        }),
        // createMarker: (icon, waypoint, index) => {
        //   // Use different icons for start and end
        //   console.log(icon, waypoint, index, icon === index - 1);
        //   const iconType =
        //     icon === 0 ? startIcon : icon === index - 1 ? endIcon : pointIcon;
        //   return L.marker(waypoint.latLng, { icon: iconType }).bindPopup(
        //     icon === 0
        //       ? startIcon
        //       : 'Starting Point' === index - 1
        //       ? 'End Point'
        //       : 'Mampir Dulu'
        //   );
        // },
      }).addTo(map);
      generatedRoutesRef.current = control;

      reverseFunction = () => {
        // Get the current waypoints
        const firstSearch = routes[0];
        const lastSearch = routes[routes.length - 1];
        let newRoutes = routes.map((route, index, arr) => {
          if (index === 0) {
            return lastSearch;
          }
          if (index === arr.length - 1) return firstSearch;
          return route;
        });

        setRoutes(newRoutes);
        const firstIndex = markers[0];
        const lastIndex = markers[markers.length - 1];
        let newMarker = markers.map((mark, index, arr) => {
          if (index === 0) {
            return lastIndex;
          }
          if (index === arr.length - 1) return firstIndex;
          return mark;
        });

        setMarkers(newMarker);
      };

      reverseBtn.current.addEventListener('click', reverseFunction);

      control.on('routesfound', (e) => {
        console.log(e);
        const mappedArray = e.routes.map((route) => {
          console.log(
            'ways',
            filterWithIndex(
              route.instructions,
              (value) => value.type === 'WaypointReached'
            )
          );
          return {
            name: route.name,
            instructions: [...route.instructions],
            summary: route.summary,
            dist: chunkArrayBasedOnBreakpoints(
              route.instructions,
              filterWithIndex(
                route.instructions,
                (value) => value.type === 'WaypointReached'
              )
            ).map((res) =>
              res.reduce(
                (accumulator, currentValue) =>
                  accumulator + currentValue.distance,
                0
              )
            ),
          };
        });
        setInstructions(mappedArray);
      });
      control.on('routeselected', function (event) {
        console.log(event.route.routesIndex);
        setSelectedRoutes(event.route.routesIndex);
      });
    }

    console.log('interval hit');
    return () => {
      if (generatedRoutesRef.current) {
        generatedRoutesRef.current.remove();
      }
      reverseBtn?.current?.removeEventListener('click', reverseFunction);
    };
  }, [markers, isShowPath]);

  function onLocationFound(e) {
    let userLat = e.latlng.lat;
    let userLng = e.latlng.lng;

    // if (userMarker) {
    //     userMarker.setLatLng(e.latlng);
    // } else {
    //     userMarker = L.marker(e.latlng).addTo(map);
    // }
    let mapMarkers = {
      ...markers[0],
      geometry_coordinates: [userLat, userLng],
    };

    setUserMarker([mapMarkers]);

    map.panTo(e.latlng);
  }

  useEffect(() => {
    let itrvlId;
    console.log(startTrack);
    if (startTrack) {
      // map.locate({ setView: true, maxZoom: 16 });
      trackUser();
      itrvlId = setInterval(trackUser, 60000);
      // map.on('locationfound', onLocationFound);
    } else {
      clearInterval(itrvlId);
    }

    return () => {
      clearInterval(itrvlId);
    };
  }, [startTrack]);

  useEffect(() => {
    L.control
      .zoom({
        position: 'topright',
      })
      .addTo(map);

    const geoControl = L.Control.Geocoder.nominatim({
      defaultMarkGeocode: true,
    });

    // Store the geocoder control in the state
    setGeoCode(geoControl);

    if (navigator && !searchParams.has('routes')) {
      console.log('re');
      // navigator.geolocation.getCurrentPosition((pos) => {
      handleCenter(null, true);
      // });
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    geoCode.geocode(lastIndex >= 0 ? routes[lastIndex] : search, (res) => {
      console.log(res);
      setDataSearch(res);
      setIsShowRes(true);
    });
  };
  console.log(userMarker);
  const mToKm = (m) => {
    return `${(m / 1000).toFixed(2)} Km`;
  };
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
  console.log(routes, instructions);

  function secondsToHms(d) {
    d = Number(d);
    let h = Math.floor(d / 3600);
    let m = Math.floor((d % 3600) / 60);
    let s = Math.floor((d % 3600) % 60);

    let hDisplay = h > 0 ? h + (h == 1 ? ' hour, ' : ' hours, ') : '';
    let mDisplay = m > 0 ? m + (m == 1 ? ' minute, ' : ' minutes, ') : '';
    let sDisplay = s > 0 ? s + (s == 1 ? ' second' : ' seconds') : '';
    return hDisplay + mDisplay + sDisplay;
  }

  const renderRoutes = () => {
    let selectedInstruction = instructions[selectedRoutes];
    console.log(selectedInstruction, instructions);
    if (instructions.length < 1) return;
    return (
      <div className='bg-black text-white' key={selectedInstruction.name}>
        <div className='flex items-center justify-between py-[20px] px-[10px]'>
          <div>{selectedInstruction.name}</div>
          <div className='flex items-center gap-[20px]'>
            <div>{mToKm(selectedInstruction.summary.totalDistance)}</div>
            <div>{secondsToHms(selectedInstruction.summary.totalTime)}</div>
          </div>
        </div>
        {selectedInstruction.dist.length > 1 &&
          selectedInstruction.dist.map((item, index, arr) => {
            return (
              <div
                key={item}
                className='flex items-center justify-between py-[20px] px-[10px]'
              >
                <div>
                  {index !== arr.length - 1
                    ? `Distance to Waypoint ${index + 1}`
                    : 'Distance to Final Destionation'}
                </div>
                <div className='flex items-center gap-[20px]'>
                  <div>{mToKm(item)}</div>
                  {/* <div>{secondsToHms(selectedInstruction.summary.totalTime)}</div> */}
                </div>
              </div>
            );
          })}
        <div className='max-h-[200px] overflow-y-scroll flex flex-col gap-[10px]'>
          {selectedInstruction.instructions.map((path) => {
            return (
              <div className='p-[10px] bg-black text-white' key={path.text}>
                {path.text} - {mToKm(path.distance)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  function objectToUrlParams(obj) {
    const params = [];

    for (const key in obj) {
      params.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(
          typeof obj[key] === 'object' ? obj[key].join(';') : obj[key]
        )}`
      );
    }

    return params.join('&');
  }

  const handleCopy = () => {
    let text = 'https://map-app-tan.vercel.app' + pathname;
    let newArr = markers.map((mark) => objectToUrlParams(mark));
    text = text + '?routes=' + encodeURIComponent(newArr);
    // console.log(newArr,
    // encodeURIComponent(newArr),
    // decodeURIComponent('id%3D1%26name%3DPoint%25201%26geometry_coordinates%3D-7.7627392%252C110.3659008%26draggable%3Dfalse%26color%3Dblue%2Cid%3D2%26name%3DPoint%25202%26geometry_coordinates%3D-7.2459717%252C112.7378266%26draggable%3Dfalse%26color%3Dblue').split(',')
    // )
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      window.alert('copied');
      // setIsSuccess(true)
      return; //codes below wont be executed
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;

    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();

    document.execCommand('copy');

    document.body.removeChild(textArea);
    window.alert('copied');
    // setIsSuccess(true);
  };

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <SearchGeo handleCenter={handleCenter} />
      {isShowPath &&
        userMarker?.map((mark) => (
          <Marker
            key={mark.id}
            position={[
              mark.geometry_coordinates[0],
              mark.geometry_coordinates[1],
            ]}
            draggable={mark.draggable}
            eventHandlers={eventHandlers}
            icon={startIcon}
          >
            {/* <Popup>
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
        </Popup> */}
          </Marker>
        ))}
      {markers.map((mark, index) => (
        <Marker
          key={mark.id}
          position={[
            mark.geometry_coordinates[0],
            mark.geometry_coordinates[1],
          ]}
          draggable={mark.draggable}
          eventHandlers={eventHandlers}
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
      <div
        id='action-group'
        className='rounded-l-[8px] h-[100%] p-[10px] absolute z-[999] left-0 bottom-0 flex flex-col gap-[10px] items-start justify-end'
      >
        {/* <div
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
        </div> */}
        <div
          className='py-[10px] px-[20px] bg-black rounded-[5px] text-white'
          onClick={(e) => {
            e.stopPropagation();
            handleCenter(e, false);
          }}
        >
          Center
        </div>
        {/* {markers.length > 1 && ( */}
        <div
          className='py-[10px] px-[20px] bg-black rounded-[5px] text-white'
          // onClick={(e) => {
          //   e.stopPropagation();
          //   setIsShowPath(!isShowPath);
          // }}
          onClick={() => {
            setTimeout(toCanvas, 1000);
          }}
        >
          Print
        </div>
        <div
          className='py-[10px] px-[20px] bg-black rounded-[5px] text-white'
          // onClick={(e) => {
          //   e.stopPropagation();
          //   setIsShowPath(!isShowPath);
          // }}
          onClick={() => {
            setStartTrack(!startTrack);
          }}
        >
          Track
        </div>
        <div
          className='py-[10px] px-[20px] bg-black rounded-[5px] text-white'
          // onClick={(e) => {
          //   e.stopPropagation();
          //   setIsShowPath(!isShowPath);
          // }}
          onClick={() => {
            handleCopy();
          }}
        >
          Share
        </div>
        {/* )} */}
      </div>
      <div
        id='input-group'
        className='absolute z-[999] top-0 left-1/2 -translate-x-1/2 p-[20px] max-w-[400px]'
      >
        {console.log(routes, markers, 'here', instructions)}
        {isCreateRoute ? (
          <form onSubmit={handleSubmit} className='flex items-start gap-[20px]'>
            <div className='flex flex-col gap-[10px]'>
              {routes.map((route, index, arr) => {
                return (
                  <input
                    key={index}
                    value={routes[index]}
                    onChange={(e) => {
                      setLastIndex(index);
                      let arr = [...routes];
                      arr[index] = e.target.value;
                      setRoutes(arr);
                    }}
                    className='p-[10px] rounded-[8px] min-w-[200px]'
                    type='text'
                    name='search'
                    placeholder={`${
                      index === 0
                        ? 'Starting '
                        : index === arr.length - 1
                        ? 'Ending '
                        : `Via ${index} `
                    }`}
                  />
                );
              })}
            </div>
            <button
              // onClick={(e) => handleSubmit(e, index)}
              type='submit'
              className='py-[10px] px-[20px] bg-black rounded-[8px] text-white'
            >
              Search
            </button>
            <button
              type='button'
              className='py-[10px] px-[20px] bg-black rounded-[8px] text-white'
              onClick={(e) => {
                setRoutes([...routes, '']);
              }}
            >
              Add
            </button>
            <button
              type='button'
              className='py-[10px] px-[20px] bg-black rounded-[8px] text-white'
              onClick={(e) => {
                setIsShowPath(true);
              }}
            >
              generate
            </button>
            <button
              type='button'
              className='py-[10px] px-[20px] bg-black rounded-[8px] text-white'
              id='reverse'
              ref={reverseBtn}
            >
              Reverse
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className='flex gap-[20px]'>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='p-[10px] rounded-[8px] min-w-[200px]'
              type='text'
              name='search'
              placeholder='Search Place...'
            />
            <button
              type='submit'
              className='py-[10px] px-[20px] bg-black rounded-[8px] text-white'
            >
              Search
            </button>
            <button
              type='button'
              className='py-[10px] px-[20px] bg-black rounded-[8px] text-white'
              onClick={(e) => {
                // setMarkers([]);
                setRoutes(['Your Location', '']);
                setIsCreateRoute(true);
              }}
            >
              Direction
            </button>
          </form>
        )}
        {isShowRes && (
          <div className='mt-[10px] flex flex-col gap-[10px]'>
            {dataSearch.map((res) => {
              return (
                <div
                  role='button'
                  tabIndex={0}
                  className='bg-black text-white p-[10px] rounded-[8px]'
                  onClick={(e) => {
                    if (isCreateRoute) {
                      let newArr = [...routes];
                      newArr[lastIndex] = res.name;
                      setRoutes(newArr);
                      // handleAddMarker(
                      //   e,
                      //   [res.center.lat, res.center.lng],
                      //   lastIndex
                      // );
                    } else {
                      setSearch(e.name);
                    }
                    handleCenter(
                      e,
                      isCreateRoute ? false : true,
                      [res.center.lat, res.center.lng],
                      true,
                      lastIndex
                    );
                    setIsShowRes(false);
                  }}
                  key={res.properties.place_id}
                >
                  <div>{res.name}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div
        id='routes'
        className='absolute z-[999] bottom-0 left-1/2 -translate-x-1/2 p-[20px] max-w-[500px]'
      >
        {renderRoutes()}
      </div>
    </>
  );
}

export default MapLeaf;
