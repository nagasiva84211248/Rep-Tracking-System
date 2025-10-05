This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

https://github.com/user-attachments/assets/328fec6c-4162-49f9-a001-bf177b8ab993

## About this application (Repesentative tracking system using MAPS-unpaid) 
  ## 1. Lottie splash implementaintion.
  ## 2. Once splash is completed it will redirect to home screen which consist of map view and Rep tracking functionality.

  ```sh

    a. Map Setup & Boundary

        1. Integrate a map (Google Maps SDK).

        2. Center the map around a given city (e.g., Gurugram).

        3. Draw a circular boundary to represent the rep’s operational zone.

    b. Waypoints & Route Animation

        1. Predefine 10 waypoints along a route inside the boundary.

        2. Draw a route polyline connecting all waypoints.

        3. Animate a moving marker (car icon) following the polyline path from start to end.

    c. Check-In / Check-Out Workflow

        1. When the rep’s marker reaches the first waypoint:

                Show a Check-In button at the bottom.

    d. After Check-In:

        1. Change the button to Check-Out.

        2. Once Check-Out is done, enable the next waypoint and continue animation.

        3. Repeat the Check-In / Check-Out sequence for all waypoints.

```

## Step 2: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm install
npm react-native start

```

## Step 1: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npx
npx react-native run-android

```
