› Switching to --go
› Choose an app to open your project at http://192.168.1.223:8081/_expo/loading
› Metro waiting on exp://192.168.1.223:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
› Web is waiting on http://localhost:8081
› Using Expo Go
› Press s │ switch to development build
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› shift+m │ more tools
› Press o │ open project code in your editor
› Press ? │ show all commands

iOS Bundled 992ms node_modules/expo-router/entry.js (3384 modules)
 WARN  expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53. Use a development build instead of Expo Go. Read more at https://docs.expo.dev/develop/development-builds/introduction/.
 WARN  `expo-notifications` functionality is not fully supported in Expo Go:
We recommend you instead use a development build to avoid limitations. Learn more: https://expo.fyi/dev-client.
 LOG  SUCCESS: DevTools available globally. Use DevTools.completeReset() to clear all data
 LOG  No token found, dispatching logout
 LOG  Attempting login for: jacobleon2117@gmail.com
 LOG  API Base URL: http://192.168.1.223:3000/api/v1
Error: ENOENT: no such file or directory, open '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
    at Object.readFileSync (node:fs:449:20)
    at getCodeFrame (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:997:18)
    at Server._symbolicate (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:1079:22)
    at Server._processRequest (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:460:7) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
}
Error: ENOENT: no such file or directory, open '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
    at Object.readFileSync (node:fs:449:20)
    at getCodeFrame (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:997:18)
    at Server._symbolicate (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:1079:22)
    at Server._processRequest (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:460:7) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
}
 ERROR  Login error in API service: [AxiosError: Network Error] 

Call Stack
  handleError (node_modules/axios/dist/esm/axios.js:2555:36)
  invoke (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:382:29)
  dispatch (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:293:11)
  INTERNAL_DISPATCH_METHOD_KEY (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:229:13)
  dispatchTrustedEvent (node_modules/react-native/src/private/webapis/dom/events/internals/EventTargetInternals.js:51:51)
  setReadyState (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:699:31)
  __didCompleteResponse (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:442:25)
  apply (<native>)
  RCTNetworking.addListener$argument_1 (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:606:35)
  apply (<native>)
  emit (node_modules/react-native/Libraries/vendor/emitter/EventEmitter.js:130:36)
  apply (<native>)
  <anonymous> (node_modules/@babel/runtime/helpers/superPropGet.js:6:19)
  RCTDeviceEventEmitterImpl#emit (node_modules/react-native/Libraries/EventEmitter/RCTDeviceEventEmitter.js:33:5)
  Axios$1#request (node_modules/axios/dist/esm/axios.js:3333:58)
  throw (<native>)
  asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
  _throw (node_modules/@babel/runtime/helpers/asyncToGenerator.js:20:27)
  tryCallOne (address at (InternalBytecode.js:1:1180)
  anonymous (address at (InternalBytecode.js:1:1874)
 LOG  Weather screen - determining best location for weather
 LOG  No saved location found, requesting current GPS location
 LOG  User profile changed, has location: undefined
 LOG  No API key available for location weather data
 LOG  Location permission denied, using fallback location
 LOG  Loading weather data for location: {"city": "New York", "latitude": 40.7128, "longitude": -74.006, "source": "fallback", "state": "NY"}
 LOG  Fetching weather data for coordinates: 40.7128, -74.006
 LOG  Throttling weather API call - waiting 30 seconds between calls
Error: ENOENT: no such file or directory, open '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
    at Object.readFileSync (node:fs:449:20)
    at getCodeFrame (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:997:18)
    at Server._symbolicate (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:1079:22)
    at Server._processRequest (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:460:7) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
}
Error: ENOENT: no such file or directory, open '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
    at Object.readFileSync (node:fs:449:20)
    at getCodeFrame (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:997:18)
    at Server._symbolicate (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:1079:22)
    at Server._processRequest (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:460:7) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
}
 ERROR  Error fetching weather: [AxiosError: Network Error] 

Call Stack
  handleError (node_modules/axios/dist/esm/axios.js:2555:36)
  invoke (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:382:29)
  dispatch (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:293:11)
  INTERNAL_DISPATCH_METHOD_KEY (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:229:13)
  dispatchTrustedEvent (node_modules/react-native/src/private/webapis/dom/events/internals/EventTargetInternals.js:51:51)
  setReadyState (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:699:31)
  __didCompleteResponse (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:442:25)
  apply (<native>)
  RCTNetworking.addListener$argument_1 (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:606:35)
  apply (<native>)
  emit (node_modules/react-native/Libraries/vendor/emitter/EventEmitter.js:130:36)
  apply (<native>)
  <anonymous> (node_modules/@babel/runtime/helpers/superPropGet.js:6:19)
  RCTDeviceEventEmitterImpl#emit (node_modules/react-native/Libraries/EventEmitter/RCTDeviceEventEmitter.js:33:5)
  Axios$1#request (node_modules/axios/dist/esm/axios.js:3333:58)
  throw (<native>)
  asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
  _throw (node_modules/@babel/runtime/helpers/asyncToGenerator.js:20:27)
  tryCallOne (address at (InternalBytecode.js:1:1180)
  anonymous (address at (InternalBytecode.js:1:1874)
 ERROR  Weather API error details: {"message": "Network Error", "status": undefined} 

Code: weather.tsx
  225 |     } catch (error: any) {
  226 |       console.error("Error fetching weather:", error);
> 227 |       console.error("Weather API error details:", {
      |                    ^
  228 |         status: error.response?.status,
  229 |         message: error.response?.data?.message || error.message,
  230 |       });
Call Stack
  fetchWeatherData (app/(tabs)/weather.tsx:227:20)
Error: ENOENT: no such file or directory, open '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
    at Object.readFileSync (node:fs:449:20)
    at getCodeFrame (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:997:18)
    at Server._symbolicate (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:1079:22)
    at Server._processRequest (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:460:7) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
}
Error: ENOENT: no such file or directory, open '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
    at Object.readFileSync (node:fs:449:20)
    at getCodeFrame (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:997:18)
    at Server._symbolicate (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:1079:22)
    at Server._processRequest (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:460:7) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
}
 ERROR  Error loading weather data: [AxiosError: Network Error] 

Call Stack
  handleError (node_modules/axios/dist/esm/axios.js:2555:36)
  invoke (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:382:29)
  dispatch (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:293:11)
  INTERNAL_DISPATCH_METHOD_KEY (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:229:13)
  dispatchTrustedEvent (node_modules/react-native/src/private/webapis/dom/events/internals/EventTargetInternals.js:51:51)
  setReadyState (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:699:31)
  __didCompleteResponse (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:442:25)
  apply (<native>)
  RCTNetworking.addListener$argument_1 (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:606:35)
  apply (<native>)
  emit (node_modules/react-native/Libraries/vendor/emitter/EventEmitter.js:130:36)
  apply (<native>)
  <anonymous> (node_modules/@babel/runtime/helpers/superPropGet.js:6:19)
  RCTDeviceEventEmitterImpl#emit (node_modules/react-native/Libraries/EventEmitter/RCTDeviceEventEmitter.js:33:5)
  Axios$1#request (node_modules/axios/dist/esm/axios.js:3333:58)
  throw (<native>)
  asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
  _throw (node_modules/@babel/runtime/helpers/asyncToGenerator.js:20:27)
  tryCallOne (address at (InternalBytecode.js:1:1180)
  anonymous (address at (InternalBytecode.js:1:1874)
Error: ENOENT: no such file or directory, open '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
    at Object.readFileSync (node:fs:449:20)
    at getCodeFrame (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:997:18)
    at Server._symbolicate (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:1079:22)
    at Server._processRequest (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:460:7) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
}
Error: ENOENT: no such file or directory, open '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
    at Object.readFileSync (node:fs:449:20)
    at getCodeFrame (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:997:18)
    at Server._symbolicate (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:1079:22)
    at Server._processRequest (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:460:7) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
}
 ERROR  Error fetching alerts: [AxiosError: Network Error] 

Call Stack
  handleError (node_modules/axios/dist/esm/axios.js:2555:36)
  invoke (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:382:29)
  dispatch (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:293:11)
  INTERNAL_DISPATCH_METHOD_KEY (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:229:13)
  dispatchTrustedEvent (node_modules/react-native/src/private/webapis/dom/events/internals/EventTargetInternals.js:51:51)
  setReadyState (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:699:31)
  __didCompleteResponse (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:442:25)
  apply (<native>)
  RCTNetworking.addListener$argument_1 (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:606:35)
  apply (<native>)
  emit (node_modules/react-native/Libraries/vendor/emitter/EventEmitter.js:130:36)
  apply (<native>)
  <anonymous> (node_modules/@babel/runtime/helpers/superPropGet.js:6:19)
  RCTDeviceEventEmitterImpl#emit (node_modules/react-native/Libraries/EventEmitter/RCTDeviceEventEmitter.js:33:5)
  Axios$1#request (node_modules/axios/dist/esm/axios.js:3333:58)
  throw (<native>)
  asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
  _throw (node_modules/@babel/runtime/helpers/asyncToGenerator.js:20:27)
  tryCallOne (address at (InternalBytecode.js:1:1180)
  anonymous (address at (InternalBytecode.js:1:1874)
Error: ENOENT: no such file or directory, open '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
    at Object.readFileSync (node:fs:449:20)
    at getCodeFrame (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:997:18)
    at Server._symbolicate (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:1079:22)
    at Server._processRequest (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:460:7) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
}
Error: ENOENT: no such file or directory, open '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
    at Object.readFileSync (node:fs:449:20)
    at getCodeFrame (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:997:18)
    at Server._symbolicate (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:1079:22)
    at Server._processRequest (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:460:7) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
}
 ERROR  Error fetching community alerts: [AxiosError: Network Error] 

Call Stack
  handleError (node_modules/axios/dist/esm/axios.js:2555:36)
  invoke (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:382:29)
  dispatch (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:293:11)
  INTERNAL_DISPATCH_METHOD_KEY (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:229:13)
  dispatchTrustedEvent (node_modules/react-native/src/private/webapis/dom/events/internals/EventTargetInternals.js:51:51)
  setReadyState (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:699:31)
  __didCompleteResponse (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:442:25)
  apply (<native>)
  RCTNetworking.addListener$argument_1 (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:606:35)
  apply (<native>)
  emit (node_modules/react-native/Libraries/vendor/emitter/EventEmitter.js:130:36)
  apply (<native>)
  <anonymous> (node_modules/@babel/runtime/helpers/superPropGet.js:6:19)
  RCTDeviceEventEmitterImpl#emit (node_modules/react-native/Libraries/EventEmitter/RCTDeviceEventEmitter.js:33:5)
  Axios$1#request (node_modules/axios/dist/esm/axios.js:3333:58)
  throw (<native>)
  asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
  _throw (node_modules/@babel/runtime/helpers/asyncToGenerator.js:20:27)
  tryCallOne (address at (InternalBytecode.js:1:1180)
  anonymous (address at (InternalBytecode.js:1:1874)
 LOG  Throttling weather API call - waiting 30 seconds between calls
 LOG  Fetching alerts with params: {}
 LOG  Using fallback demo alerts due to API error
 ERROR  API Error details: Network Error 

Code: alerts.tsx
  155 |           }
  156 |         } catch (apiError: any) {
> 157 |           console.error("API Error details:", apiError.response?.data || apiError.message);
      |                        ^
  158 |
  159 |           console.log("Using fallback demo alerts due to API error");
  160 |           const demoAlerts = generateDemoAlerts(city, state);
Call Stack
  fetchAlerts (app/(tabs)/alerts.tsx:157:24)



› Switching to --go
› Choose an app to open your project at http://192.168.1.223:8081/_expo/loading
› Metro waiting on exp://192.168.1.223:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
› Web is waiting on http://localhost:8081
› Using Expo Go
› Press s │ switch to development build
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› shift+m │ more tools
› Press o │ open project code in your editor
› Press ? │ show all commands

iOS Bundled 1037ms node_modules/expo-router/entry.js (3483 modules)
 WARN  expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53. Use a development build instead of Expo Go. Read more at https://docs.expo.dev/develop/development-builds/introduction/.
 WARN  `expo-notifications` functionality is not fully supported in Expo Go:
We recommend you instead use a development build to avoid limitations. Learn more: https://expo.fyi/dev-client.
 LOG  SUCCESS: DevTools available globally. Use DevTools.completeReset() to clear all data
 LOG  Token found, fetching user profile
 LOG  No existing authentication found: [AxiosError: Request failed with status code 500]
 LOG  Attempting login for: jacobleon2117@gmail.com
 LOG  API Base URL: http://192.168.1.223:3000/api/v1
 LOG  Login response received
 LOG  Login successful, tokens saved
Error: ENOENT: no such file or directory, open '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
    at Object.readFileSync (node:fs:449:20)
    at getCodeFrame (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:997:18)
    at Server._symbolicate (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:1079:22)
    at Server._processRequest (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:460:7) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
}
Error: ENOENT: no such file or directory, open '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
    at Object.readFileSync (node:fs:449:20)
    at getCodeFrame (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:997:18)
    at Server._symbolicate (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:1079:22)
    at Server._processRequest (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:460:7) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
}
 ERROR  Error getting push token: [Error: Error encountered while fetching Expo token, expected an OK response, received: 400 (body: "{"errors":[{"code":"VALIDATION_ERROR","type":"USER","message":"\"projectId\": Invalid uuid.","isTransient":false,"requestId":"27dbc54c-e409-42de-9ecc-74be1ad6f892"}]}").] 

Call Stack
  construct (<native>)
  apply (<native>)
  _construct (node_modules/@babel/runtime/helpers/construct.js:4:65)
  Wrapper (node_modules/@babel/runtime/helpers/wrapNativeSuper.js:15:23)
  construct (<native>)
  _callSuper (node_modules/@babel/runtime/helpers/callSuper.js:5:108)
  constructor (node_modules/expo-modules-core/src/errors/CodedError.ts:11:5)
  getExpoPushTokenAsync (node_modules/expo-notifications/build/getExpoPushTokenAsync.js:89:29)
  next (<native>)
  asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
  _next (node_modules/@babel/runtime/helpers/asyncToGenerator.js:17:27)
  tryCallOne (address at (InternalBytecode.js:1:1180)
  anonymous (address at (InternalBytecode.js:1:1874)
Error: ENOENT: no such file or directory, open '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
    at Object.readFileSync (node:fs:449:20)
    at getCodeFrame (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:997:18)
    at Server._symbolicate (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:1079:22)
    at Server._processRequest (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:460:7) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
}
Error: ENOENT: no such file or directory, open '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
    at Object.readFileSync (node:fs:449:20)
    at getCodeFrame (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:997:18)
    at Server._symbolicate (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:1079:22)
    at Server._processRequest (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:460:7) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
}
 ERROR  Error fetching posts: [AxiosError: Request failed with status code 500] 

Call Stack
  settle (node_modules/axios/dist/esm/axios.js:2052:28)
  onloadend (node_modules/axios/dist/esm/axios.js:2502:13)
  invoke (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:382:29)
  dispatch (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:293:11)
  INTERNAL_DISPATCH_METHOD_KEY (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:229:13)
  dispatchTrustedEvent (node_modules/react-native/src/private/webapis/dom/events/internals/EventTargetInternals.js:51:51)
  setReadyState (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:704:27)
  __didCompleteResponse (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:442:25)
  apply (<native>)
  RCTNetworking.addListener$argument_1 (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:606:35)
  apply (<native>)
  emit (node_modules/react-native/Libraries/vendor/emitter/EventEmitter.js:130:36)
  apply (<native>)
  <anonymous> (node_modules/@babel/runtime/helpers/superPropGet.js:6:19)
  RCTDeviceEventEmitterImpl#emit (node_modules/react-native/Libraries/EventEmitter/RCTDeviceEventEmitter.js:33:5)
  Axios$1#request (node_modules/axios/dist/esm/axios.js:3333:58)
  throw (<native>)
  asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
  _throw (node_modules/@babel/runtime/helpers/asyncToGenerator.js:20:27)
  tryCallOne (address at (InternalBytecode.js:1:1180)
  anonymous (address at (InternalBytecode.js:1:1874)
Error: ENOENT: no such file or directory, open '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
    at Object.readFileSync (node:fs:449:20)
    at getCodeFrame (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:997:18)
    at Server._symbolicate (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:1079:22)
    at Server._processRequest (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:460:7) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
}
Error: ENOENT: no such file or directory, open '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
    at Object.readFileSync (node:fs:449:20)
    at getCodeFrame (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:997:18)
    at Server._symbolicate (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:1079:22)
    at Server._processRequest (/Users/jacobleon/stormneighbor-app/frontend/node_modules/metro/src/Server.js:460:7) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/jacobleon/stormneighbor-app/frontend/InternalBytecode.js'
}
 ERROR  Error fetching posts: [AxiosError: Request failed with status code 500] 

Call Stack
  settle (node_modules/axios/dist/esm/axios.js:2052:28)
  onloadend (node_modules/axios/dist/esm/axios.js:2502:13)
  invoke (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:382:29)
  dispatch (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:293:11)
  INTERNAL_DISPATCH_METHOD_KEY (node_modules/react-native/src/private/webapis/dom/events/EventTarget.js:229:13)
  dispatchTrustedEvent (node_modules/react-native/src/private/webapis/dom/events/internals/EventTargetInternals.js:51:51)
  setReadyState (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:704:27)
  __didCompleteResponse (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:442:25)
  apply (<native>)
  RCTNetworking.addListener$argument_1 (node_modules/react-native/Libraries/Network/XMLHttpRequest.js:606:35)
  apply (<native>)
  emit (node_modules/react-native/Libraries/vendor/emitter/EventEmitter.js:130:36)
  apply (<native>)
  <anonymous> (node_modules/@babel/runtime/helpers/superPropGet.js:6:19)
  RCTDeviceEventEmitterImpl#emit (node_modules/react-native/Libraries/EventEmitter/RCTDeviceEventEmitter.js:33:5)
  Axios$1#request (node_modules/axios/dist/esm/axios.js:3333:58)
  throw (<native>)
  asyncGeneratorStep (node_modules/@babel/runtime/helpers/asyncToGenerator.js:3:17)
  _throw (node_modules/@babel/runtime/helpers/asyncToGenerator.js:20:27)
  tryCallOne (address at (InternalBytecode.js:1:1180)
  anonymous (address at (InternalBytecode.js:1:1874)
 LOG  Onboarding check: {"addressState": undefined, "hasHomeLocation": undefined, "hasLegacyLocation": undefined, "hasLocationPreferences": undefined, "homeCity": undefined, "homeState": undefined, "locationCity": undefined, "locationPreferences": undefined, "needsLocationOnboarding": true, "needsPermissionsOnboarding": true}
 LOG  Redirecting to location permissions setup
 ERROR  Error requesting location permissions: [Error: One of the `NSLocation*UsageDescription` keys must be present in Info.plist to be able to use geolocation.] 

Code: construct.js
  2 | var setPrototypeOf = require("./setPrototypeOf.js");
  3 | function _construct(t, e, r) {
> 4 |   if (isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments);
    |                                                                 ^
  5 |   var o = [null];
  6 |   o.push.apply(o, e);
  7 |   var p = new (t.bind.apply(t, o))();
Call Stack
  construct (<native>)
  apply (<native>)
  _construct (node_modules/@babel/runtime/helpers/construct.js:4:65)
  Wrapper (node_modules/@babel/runtime/helpers/wrapNativeSuper.js:15:23)
  construct (<native>)
  _callSuper (node_modules/@babel/runtime/helpers/callSuper.js:5:108)
  constructor (node_modules/expo-modules-core/src/errors/CodedError.ts:11:5)
 ERROR  Error setting home address from current location: [Error: No refresh token available] 

Code: api.ts
  105 |     const refreshToken = await this.getRefreshToken();
  106 |     if (!refreshToken) {
> 107 |       throw new Error("No refresh token available");
      |                      ^
  108 |     }
  109 |
  110 |     const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh-token`, {
Call Stack
  ApiService#refreshToken (services/api.ts:107:22)
 ERROR  Error saving home address: [Error: No refresh token available] 

Code: api.ts
  105 |     const refreshToken = await this.getRefreshToken();
  106 |     if (!refreshToken) {
> 107 |       throw new Error("No refresh token available");
      |                      ^
  108 |     }
  109 |
  110 |     const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh-token`, {
Call Stack
  ApiService#refreshToken (services/api.ts:107:22)
 ERROR  Update notification preferences error in API service: [Error: No refresh token available] 

Code: api.ts
  105 |     const refreshToken = await this.getRefreshToken();
  106 |     if (!refreshToken) {
> 107 |       throw new Error("No refresh token available");
      |                      ^
  108 |     }
  109 |
  110 |     const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh-token`, {
Call Stack
  ApiService#refreshToken (services/api.ts:107:22)
 ERROR  Failed to save notification preferences: [Error: No refresh token available] 

Code: api.ts
  105 |     const refreshToken = await this.getRefreshToken();
  106 |     if (!refreshToken) {
> 107 |       throw new Error("No refresh token available");
      |                      ^
  108 |     }
  109 |
  110 |     const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh-token`, {
Call Stack
  ApiService#refreshToken (services/api.ts:107:22)
 ERROR  Update notification preferences error in API service: [Error: No refresh token available] 

Code: api.ts
  105 |     const refreshToken = await this.getRefreshToken();
  106 |     if (!refreshToken) {
> 107 |       throw new Error("No refresh token available");
      |                      ^
  108 |     }
  109 |
  110 |     const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh-token`, {
Call Stack
  ApiService#refreshToken (services/api.ts:107:22)
 ERROR  Failed to save final notification preferences: [Error: No refresh token available] 

Code: api.ts
  105 |     const refreshToken = await this.getRefreshToken();
  106 |     if (!refreshToken) {
> 107 |       throw new Error("No refresh token available");
      |                      ^
  108 |     }
  109 |
  110 |     const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh-token`, {
Call Stack
  ApiService#refreshToken (services/api.ts:107:22)
 ERROR  Error fetching posts: [Error: No refresh token available] 

Code: api.ts
  105 |     const refreshToken = await this.getRefreshToken();
  106 |     if (!refreshToken) {
> 107 |       throw new Error("No refresh token available");
      |                      ^
  108 |     }
  109 |
  110 |     const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh-token`, {
Call Stack
  ApiService#refreshToken (services/api.ts:107:22)
 ERROR  Error fetching posts: [Error: No refresh token available] 

Code: api.ts
  105 |     const refreshToken = await this.getRefreshToken();
  106 |     if (!refreshToken) {
> 107 |       throw new Error("No refresh token available");
      |                      ^
  108 |     }
  109 |
  110 |     const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh-token`, {
Call Stack
  ApiService#refreshToken (services/api.ts:107:22)
 LOG  Weather screen - determining best location for weather
 LOG  Using current GPS location for weather
 LOG  User profile changed, has location: undefined
 LOG  No API key available for location weather data
 LOG  Loading weather data for location: {"city": "Owasso", "latitude": 36.309120423500055, "longitude": -95.78236694069555, "source": "current", "state": "OK"}
 LOG  Fetching weather data for coordinates: 36.309120423500055, -95.78236694069555
 LOG  Throttling weather API call - waiting 30 seconds between calls
 ERROR  Error fetching community alerts: [Error: No refresh token available] 

Code: api.ts
  105 |     const refreshToken = await this.getRefreshToken();
  106 |     if (!refreshToken) {
> 107 |       throw new Error("No refresh token available");
      |                      ^
  108 |     }
  109 |
  110 |     const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh-token`, {
Call Stack
  ApiService#refreshToken (services/api.ts:107:22)
 LOG  Weather API response: {"dataKeys": ["location", "current", "forecast", "lastUpdated", "source"], "hasData": true, "success": true}
 LOG  Setting weather data: {"current": {"detailedForecast": "Sunny, with a high near 82. Northeast wind around 5 mph.", "icon": "https://api.weather.gov/icons/land/day/skc?size=medium", "isDaytime": true, "shortForecast": "Sunny", "temperature": 82, "temperatureUnit": "F", "windDirection": "NE", "windSpeed": "5 mph"}, "forecast": [{"detailedForecast": "Sunny, with a high near 82. Northeast wind around 5 mph.", "endTime": "2025-09-26T18:00:00-05:00", "icon": "https://api.weather.gov/icons/land/day/skc?size=medium", "isDaytime": true, "name": "This Afternoon", "number": 1, "probabilityOfPrecipitation": [Object], "shortForecast": "Sunny", "startTime": "2025-09-26T16:00:00-05:00", "temperature": 82, "temperatureTrend": "", "temperatureUnit": "F", "windDirection": "NE", "windSpeed": "5 mph"}, {"detailedForecast": "Clear, with a low around 59. Southeast wind around 5 mph.", "endTime": "2025-09-27T06:00:00-05:00", "icon": "https://api.weather.gov/icons/land/night/skc?size=medium", "isDaytime": false, "name": "Tonight", "number": 2, "probabilityOfPrecipitation": [Object], "shortForecast": "Clear", "startTime": "2025-09-26T18:00:00-05:00", "temperature": 59, "temperatureTrend": "", "temperatureUnit": "F", "windDirection": "SE", "windSpeed": "5 mph"}, {"detailedForecast": "Sunny, with a high near 86. Southeast wind 0 to 5 mph.", "endTime": "2025-09-27T18:00:00-05:00", "icon": "https://api.weather.gov/icons/land/day/few?size=medium", "isDaytime": true, "name": "Saturday", "number": 3, "probabilityOfPrecipitation": [Object], "shortForecast": "Sunny", "startTime": "2025-09-27T06:00:00-05:00", "temperature": 86, "temperatureTrend": "", "temperatureUnit": "F", "windDirection": "SE", "windSpeed": "0 to 5 mph"}, {"detailedForecast": "Mostly clear, with a low around 60. Southeast wind 0 to 5 mph.", "endTime": "2025-09-28T06:00:00-05:00", "icon": "https://api.weather.gov/icons/land/night/few?size=medium", "isDaytime": false, "name": "Saturday Night", "number": 4, "probabilityOfPrecipitation": [Object], "shortForecast": "Mostly Clear", "startTime": "2025-09-27T18:00:00-05:00", "temperature": 60, "temperatureTrend": "", "temperatureUnit": "F", "windDirection": "SE", "windSpeed": "0 to 5 mph"}, {"detailedForecast": "Sunny, with a high near 86. Southeast wind 0 to 5 mph.", "endTime": "2025-09-28T18:00:00-05:00", "icon": "https://api.weather.gov/icons/land/day/skc?size=medium", "isDaytime": true, "name": "Sunday", "number": 5, "probabilityOfPrecipitation": [Object], "shortForecast": "Sunny", "startTime": "2025-09-28T06:00:00-05:00", "temperature": 86, "temperatureTrend": "", "temperatureUnit": "F", "windDirection": "SE", "windSpeed": "0 to 5 mph"}, {"detailedForecast": "Mostly clear, with a low around 61. East wind 0 to 5 mph.", "endTime": "2025-09-29T06:00:00-05:00", "icon": "https://api.weather.gov/icons/land/night/few?size=medium", "isDaytime": false, "name": "Sunday Night", "number": 6, "probabilityOfPrecipitation": [Object], "shortForecast": "Mostly Clear", "startTime": "2025-09-28T18:00:00-05:00", "temperature": 61, "temperatureTrend": "", "temperatureUnit": "F", "windDirection": "E", "windSpeed": "0 to 5 mph"}, {"detailedForecast": "Mostly sunny, with a high near 84. Southeast wind 0 to 5 mph.", "endTime": "2025-09-29T18:00:00-05:00", "icon": "https://api.weather.gov/icons/land/day/sct?size=medium", "isDaytime": true, "name": "Monday", "number": 7, "probabilityOfPrecipitation": [Object], "shortForecast": "Mostly Sunny", "startTime": "2025-09-29T06:00:00-05:00", "temperature": 84, "temperatureTrend": "", "temperatureUnit": "F", "windDirection": "SE", "windSpeed": "0 to 5 mph"}], "lastUpdated": "2025-09-26T21:32:01.018Z", "location": {"latitude": 36.309120423500055, "longitude": -95.78236694069555}, "source": "NOAA"}
 LOG  Weather data loaded successfully
 LOG  Map ready for overlays
 LOG  Fetching alerts with params: {}
 LOG  Using fallback demo alerts due to API error
 ERROR  API Error details: {"message": "City and state are required for alerts", "success": false} 

Code: alerts.tsx
  155 |           }
  156 |         } catch (apiError: any) {
> 157 |           console.error("API Error details:", apiError.response?.data || apiError.message);
      |                        ^
  158 |
  159 |           console.log("Using fallback demo alerts due to API error");
  160 |           const demoAlerts = generateDemoAlerts(city, state);
Call Stack
  fetchAlerts (app/(tabs)/alerts.tsx:157:24)