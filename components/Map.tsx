import { useFetch } from "@/lib/fetch";
import {
  calculateDriverTimes,
  calculateRegion,
  generateMarkersFromData,
} from "@/lib/map";
import { useDriverStore, useLocationStore } from "@/store/index";
import { Driver, MarkerData } from "@/types/type";
import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

function MapComponent() {
  const { data: drivers, loading, error } = useFetch<Driver[]>("/(api)/driver");
  const {
    userLatitude,
    userLongitude,
    destinationLongitude,
    destinationLatitude,
  } = useLocationStore();
  const { selectedDriver, setDrivers } = useDriverStore();
  const [markers, setMarkers] = useState<MarkerData[]>([]);

  const webViewRef = useRef<WebView>(null);
  const [webViewReady, setWebViewReady] = useState(false);

  // get region FIRST
  const region = calculateRegion({
    userLongitude: userLongitude ?? null,
    userLatitude: userLatitude ?? null,
    destinationLongitude: destinationLongitude ?? null,
    destinationLatitude: destinationLatitude ?? null,
  });

  // Get user location once on mount
  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access location was denied");
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      console.log(`"longitude":${longitude}, "latitude":${latitude}`);

      const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      // Build a more readable address by prioritizing street/city over name
      const addressComponents = [];

      // Add street number and name if available
      if (address[0].streetNumber)
        addressComponents.push(address[0].streetNumber);
      if (address[0].street) addressComponents.push(address[0].street);

      // If no street info, try subregion or district
      if (addressComponents.length === 0) {
        if (address[0].subregion) addressComponents.push(address[0].subregion);
        else if (address[0].district)
          addressComponents.push(address[0].district);
      }

      // Add city/region
      if (address[0].city) addressComponents.push(address[0].city);
      else if (address[0].region) addressComponents.push(address[0].region);

      const readableAddress =
        addressComponents.join(", ") || "Location not found";

      useLocationStore.getState().setUserLocation({
        latitude,
        longitude,
        address: `${readableAddress}, ${address[0].region || ""}`,
      });
    };

    getLocation();
  }, []);

  // Generate markers when drivers or user location changes
  useEffect(() => {
    if (Array.isArray(drivers)) {
      if (!userLatitude || !userLongitude) return;

      const newMarkers = generateMarkersFromData({
        data: drivers,
        userLongitude,
        userLatitude,
      });
      setMarkers(newMarkers);
    }
  }, [drivers, userLatitude, userLongitude]);

  // Send driver markers to WebView
  useEffect(() => {
    if (markers.length > 0 && webViewRef.current && webViewReady) {
      const message = JSON.stringify({
        type: "updateDrivers",
        markers: markers,
        selectedDriverId: selectedDriver,
      });

      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new MessageEvent('message', { data: '${message}' }));
          true;
        `);
      }, 100);
    }
  }, [markers, selectedDriver, webViewReady]);

  //calculate time
  useEffect(() => {
    if (
      markers.length > 0 &&
      destinationLatitude !== undefined &&
      destinationLongitude !== undefined
    ) {
      calculateDriverTimes({
        markers,
        userLatitude,
        userLongitude,
        destinationLatitude,
        destinationLongitude,
      }).then((drivers) => {
        setDrivers(drivers as MarkerData[]);
      });
    }
  }, [markers, destinationLatitude, destinationLongitude]);

  // Send updated location to WebView whenever store updates
  useEffect(() => {
    if (userLatitude && userLongitude && webViewRef.current && webViewReady) {
      console.log("📍 Sending location update:", userLatitude, userLongitude);
      const message = JSON.stringify({
        type: "updateLocation",
        latitude: userLatitude,
        longitude: userLongitude,
      });

      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new MessageEvent('message', { data: '${message}' }));
          true;
        `);
      }, 100);
    }
  }, [userLatitude, userLongitude, webViewReady]);

  // Send updated destination
  useEffect(() => {
    if (
      destinationLatitude &&
      destinationLongitude &&
      webViewRef.current &&
      webViewReady
    ) {
      console.log(
        "🎯 Sending destination update:",
        destinationLatitude,
        destinationLongitude
      );
      const message = JSON.stringify({
        type: "updateDestination",
        latitude: destinationLatitude,
        longitude: destinationLongitude,
      });

      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new MessageEvent('message', { data: '${message}' }));
          true;
        `);
      }, 100);
    }
  }, [destinationLatitude, destinationLongitude, webViewReady]);

  // if (loading || (!userLatitude && !userLongitude))
  //   return (
  //     <View className="flex justify-between items-center w-full">
  //       <ActivityIndicator size="small" color="#000" />
  //     </View>
  //   );

  // if (error)
  //   return (
  //     <View className="flex justify-between items-center w-full">
  //       <Text>Error: {error}</Text>
  //     </View>
  //   );
  // Static HTML with driver markers support
  const leafletHTML = useMemo(
    () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
            integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
            crossorigin=""/>
      <style>
        body, html { 
          margin: 0; 
          padding: 0; 
          height: 100%; 
          font-family: Arial, sans-serif;
          touch-action: none;
        }
        #map { 
          height: 100vh; 
          width: 100%;
          touch-action: none;
        }
        .custom-marker {
          background-color: #007AFF;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        .driver-marker {
          background-color: #34C759;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        .driver-marker.selected {
          background-color: #FF9500;
          border: 3px solid white;
          box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        }
        .leaflet-control-container {
          pointer-events: auto;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
              integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
              crossorigin=""></script>
      
      <script>
        let map;
        let userMarker;
        let destinationMarker;
        let driverMarkers = [];
        
        // Initialize map with region coordinates
        function initMap(lat, lng, zoom) {
          console.log('🗺️ Initializing map at:', lat, lng);
          map = L.map('map', {
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: true,
            keyboard: true,
            dragging: true,
            touchZoom: true
          }).setView([lat, lng], zoom);
          
          // Add OpenStreetMap tiles (free)
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          
          // Handle map clicks
          map.on('click', function(e) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapClick',
                latitude: e.latlng.lat,
                longitude: e.latlng.lng
              }));
            }
          });
          
          console.log('✅ Map initialized successfully');
        }
        
        // Update user location on map
        function updateUserLocation(lat, lng) {
          console.log('📍 Updating user location:', lat, lng);
          if (userMarker) {
            map.removeLayer(userMarker);
          }
          
          // Create custom icon for user location
          const userIcon = L.divIcon({
            className: 'custom-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          
          userMarker = L.marker([lat, lng], { icon: userIcon })
            .addTo(map)
            .bindPopup('You are here');
          
          // Center map on user location
          map.setView([lat, lng], 13);
          
        }
        
        // Update destination on map
        function updateDestination(lat, lng) {
         
          if (destinationMarker) {
            map.removeLayer(destinationMarker);
          }
          
          destinationMarker = L.marker([lat, lng])
            .addTo(map)
            .bindPopup('Destination');
          
          console.log('✅ Destination updated');
        }
        
        // Clear existing driver markers
        function clearDriverMarkers() {
          driverMarkers.forEach(marker => {
            map.removeLayer(marker);
          });
          driverMarkers = [];
        }
        
        // Update driver markers on map
        function updateDriverMarkers(markers, selectedDriverId) {
          
          
          // Clear existing markers
          clearDriverMarkers();
          
          markers.forEach(markerData => {
            const isSelected = markerData.id === selectedDriverId;
            const markerClass = isSelected ? 'driver-marker selected' : 'driver-marker';
            
            const driverIcon = L.divIcon({
              className: markerClass,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            });
            
            const marker = L.marker([markerData.latitude, markerData.longitude], { 
              icon: driverIcon 
            })
            .addTo(map)
            .bindPopup(markerData.title || 'Driver');
            
            // Add click handler for driver selection
            marker.on('click', function() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'driverSelected',
                  driverId: markerData.id
                }));
              }
            });
            
            driverMarkers.push(marker);
          });
          
         
        }
        
        // Listen for messages from React Native
        window.addEventListener('message', function(event) {
          
          const data = JSON.parse(event.data);
          
          if (data.type === 'updateLocation') {
            updateUserLocation(data.latitude, data.longitude);
          } else if (data.type === 'updateDestination') {
            updateDestination(data.latitude, data.longitude);
          } else if (data.type === 'updateDrivers') {
            updateDriverMarkers(data.markers, data.selectedDriverId);
          }
        });
        
        // Initialize map when page loads
        document.addEventListener('DOMContentLoaded', () => {
          initMap(${region.latitude}, ${region.longitude}, 13);
        });
      </script>
    </body>
    </html>
  `,
    [region.latitude, region.longitude]
  );

  // Handle WebView ready state
  const handleWebViewLoad = () => {
    setWebViewReady(true);
  };

  // Handle messages from WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("📨 Message from WebView:", data);

      if (data.type === "driverSelected") {
        // Update selected driver in store
        useDriverStore.getState().setSelectedDriver(data.driverId);
      }
    } catch (error) {
      console.log("Error parsing WebView message:", error);
    }
  };

  // Return loading state if region is not ready
  if (!region) {
    return (
      <View style={styles.container}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: leafletHTML }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        onLoad={handleWebViewLoad}
        onMessage={handleWebViewMessage}
      />
    </View>
  );
}

export default MapComponent;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, width: "100%" },
});
