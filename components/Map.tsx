import { useLocationStore } from "@/store/index"; // adjust path!
import * as Location from "expo-location";
import React, { useEffect, useRef } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

function MapComponent() {
  const { setUserLocation, userLatitude, userLongitude } = useLocationStore();
  const webViewRef = useRef<WebView>(null);

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

      setUserLocation({
        latitude,
        longitude,
        address: `${address[0].name || ""}, ${address[0].region || ""}`,
      });
    };

    getLocation();
  }, []);

  // Send updated location to WebView whenever store updates
  useEffect(() => {
    if (userLatitude && userLongitude && webViewRef.current) {
      const message = JSON.stringify({
        type: "updateLocation",
        latitude: userLatitude,
        longitude: userLongitude,
      });

      webViewRef.current.injectJavaScript(`
        window.dispatchEvent(new MessageEvent('message', { data: '${message}' }));
      `);
    }
  }, [userLatitude, userLongitude]);

  // Static HTML (memoized so it doesn’t cause reloads)
  // const leafletHTML = useMemo(
  //   () => `<!DOCTYPE html>
  //   <html>
  //   <head>
  //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //     <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  //     <style>
  //       body, html {margin:0; padding:0; height:100%;}
  //       #map {height:100vh; width:100%;}
  //     </style>
  //   </head>
  //   <body>
  //     <div id="map"></div>
  //     <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  //     <script>
  //       let map, userMarker;

  //       function initMap() {
  //         map = L.map('map').setView([37.78825, -122.4324], 13);
  //         L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  //           maxZoom: 19,
  //           attribution: '© OpenStreetMap'
  //         }).addTo(map);
  //       }

  //       function updateUserLocation(lat, lng) {
  //         if (userMarker) map.removeLayer(userMarker);
  //         userMarker = L.marker([lat, lng]).addTo(map).bindPopup('You are here').openPopup();
  //         map.setView([lat, lng], 13);
  //       }

  //       window.addEventListener('message', function(event) {
  //         const data = JSON.parse(event.data);
  //         if (data.type === 'updateLocation') {
  //           updateUserLocation(data.latitude, data.longitude);
  //         }
  //       });

  //       document.addEventListener('DOMContentLoaded', initMap);
  //     </script>
  //   </body>
  //   </html>`,
  //   []
  // );

  return (
    <View style={styles.container}>
      {/* <WebView
        ref={webViewRef}
        source={{ html: leafletHTML }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
      /> */}
      <Text>happy</Text>
    </View>
  );
}

// ✅ Wrap with React.memo
const Map = React.memo(MapComponent);

export default Map;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, width: "100%" },
});
