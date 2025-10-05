import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated, Easing,  ActivityIndicator } from 'react-native';
import MapView, { Circle, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { locations, centerLoc, IStartTimeEndTimeDistance } from './types';
import BottomSheet from '../../components/BottmSheet';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../../App';
import moment from 'moment';
import TextButtonComponent from '../../components/TextButtonComponent';
import ImageButtonComponent from '../../components/ImageButtonComponent';

type HomeScreenProps = StackScreenProps<RootStackParamList, 'HomeScreen'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const mapRef = useRef<MapView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);  //==> Based on current index waypoints will switch locations
  const [checkIn, setCheckIn] = useState<boolean>(false); //==> Used for Check-in logs(time)
  const [checkOut, setCheckOut] = useState<boolean>(false);  //==> Used for Check-out logs(time)
  const [repStart, setRepStart] = useState<boolean>(true); //==> Used for start towards initial repesentative location
  const [continueNav, setContinueNav] = useState<boolean>(false);  //==> Once check out from current waypoints animation will trigger (useEffect dependency state)
  const [enableWaypoint, setEnableWayPoint] = useState<boolean>(false);  //==> Repesentative location to initial wavpoint identifier. Initial Check-in starts.
  const [showBottomSheet, setShowBottomSheet] = useState<boolean>(false);  //==> Enable bottom sheet
  const [updateCurrentIndex, setUpdateCurrentIndex] = useState<number>(0);  //==> Used for update Check-in and check-out logs(time), and also bottom state will update(color and Progress count)
  const [summary, setSummary] = useState<boolean>(false);  //==> Used for storing check-in and check-out logs(time) for summary content.
  const [resetLoc, setResetLoc] = useState<boolean>(false); // => Reset all
  const [carKey, setCarKey] = useState(0); // when Reset navigator(car) id should update
  const [duration, setDuration] = useState<IStartTimeEndTimeDistance>({
    startTime: "",
    endTime: "",
    distance: 0
  }); // summary data
  const [loader, setLoader] = useState<boolean>(false); // display loader

  //  ==> used for animate navigator(car) position
  const animatedLat = useRef(new Animated.Value(locations[0].latitude)).current;
  const animatedLng = useRef(new Animated.Value(locations[0].longitude)).current;

  const [carPosition, setCarPosition] = useState({  // ==> Initial navigator(car) position
    latitude: 28.44265873386783,
    longitude: 77.03606983482838,
  });

  // ==> Trigger when component mounts Initial addListener
  useEffect(() => {
    const latListener = animatedLat.addListener(({ value }) => {
      setCarPosition(pos => ({ ...pos, latitude: value }));
    });
    const lngListener = animatedLng.addListener(({ value }) => {
      setCarPosition(pos => ({ ...pos, longitude: value }));
    });

    return () => {
      //  ==> Trigger when component unmounts
      animatedLat.removeListener(latListener);
      animatedLng.removeListener(lngListener);
    };
  }, [resetLoc]);

  // ==> Amimation logic states update based on dependency states (repStart, continueNav)
  useEffect(() => {
    console.log("currentIndex", currentIndex)
    if (currentIndex >= locations.length - 1) return;
    if (repStart) return;
    if (currentIndex === 0 && !enableWaypoint) {
      setCarPosition({
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
      })
      setEnableWayPoint(prev => !prev);
      return setCheckIn(prev => !prev);
    }
    console.log('started')
    setCurrentIndex(currentIndex + 1);
    const start = locations[currentIndex];
    const end = locations[currentIndex + 1];

    Animated.timing(animatedLat, {
      toValue: end.latitude,
      duration: 5500,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    Animated.timing(animatedLng, {
      toValue: end.longitude,
      duration: 5500,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(() => {
      setCheckIn(prev => !prev);
      mapRef.current?.animateToRegion(
        {
          latitude: end.latitude,
          longitude: end.longitude,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        },
        1500
      );
    });
  }, [repStart, continueNav, resetLoc]);

  useEffect(() => {
    if ((currentIndex + 1) === locations.length && !checkIn && !checkOut) {
      let totalDistance = 0;
      locations.forEach((ele) => {
        totalDistance += ele.distance;
      })
      const updatedDuration = {
        ...duration,
        endTime: moment(Date.now()).format('hh:mm:ss'),
        distance: totalDistance,
      };
      setDuration(updatedDuration);
      setLoader(true);
      setTimeout(() => {
        setLoader(false)
        navigation.navigate('SummaryScreen', { summaryData: updatedDuration });
      }, 2000);
    }
  }, [summary])

  //  ==> check-out Logic
  const handleCheckOut = () => {
    setCheckOut(prev => !prev);
    setContinueNav(prev => !prev);
    setUpdateCurrentIndex(() => {
      let updatedIndex = currentIndex + 1;
      return updatedIndex;
    });
    setSummary(prev => !prev);
  }

  //  ==> check-in Logic
  const handleCheckIn = () => {
    setCheckIn(prev => !prev);
    setCheckOut(prev => !prev);
    setSummary(prev => !prev);
  }

  //  ==> coponent mounts start waypoint Logic
  const handleRepStart = () => {
    setRepStart(prev => !prev);
    setCurrentIndex(0);
    setDuration(prev => ({
      ...prev,
      startTime: moment(Date.now()).format('hh:mm:ss')
    }))
  }

  // ==> bottom sheet enable
  const handleBottomSheet = () => {
    setShowBottomSheet(prevState => !prevState);
  }

  const reset = () => {
    setCurrentIndex(0);
    setCheckIn(false);
    setCheckOut(false);
    setRepStart(true);
    setContinueNav(false);
    setEnableWayPoint(false);
    setShowBottomSheet(false);
    setUpdateCurrentIndex(0);
    setSummary(false);
    animatedLat.setValue(locations[0].latitude);
    animatedLng.setValue(locations[0].longitude);
    setCarPosition({
      latitude: 28.44265873386783,
      longitude: 77.03606983482838,
    });
    setResetLoc(prev => !prev);
    setCarKey(prev => prev + 1);
  }


  return (
    <View style={styles.container}>
      {/* map view parent*/}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          ...centerLoc,
          latitudeDelta: 0.040,
          longitudeDelta: 0.040,
        }}
      >
        {/* circle radius with center co-ordinates */}
        <Circle
          center={centerLoc}
          radius={3000}
          strokeWidth={2}
          strokeColor="rgba(0,0,255,0.8)"
          fillColor="rgba(0,0,255,0.2)"
        />

        {/* PolyLine for all co-ordinates */}
        <Polyline
          coordinates={locations}
          strokeColor="blue"
          strokeWidth={3}
        />

        {/* way-points enable on top of polyline */}
        {locations.map((loc, index) => (
          (currentIndex >= index) &&
          <Marker
            key={index}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            title={`Marker ${index + 1}`}
          />
        ))}

        {/* Navigator(car) througth polyline one co-ordinate to another */}
        <Marker
          key={`car-${carKey}`}
          coordinate={carPosition}
          anchor={{ x: 0.5, y: 0.5 }}
          flat={true}
          image={require('../../assets/images/car.png')}
        />
      </MapView>

      {/* check-in and check-out buttons based on condition  */}
      {currentIndex >= 0 &&
        <View style={styles.btnContainer}>
          {
            checkIn &&
            <TextButtonComponent
              onPress={handleCheckIn}
              backgroundColor={'blue'}
              title={'Check In'}
              position={{ right: 25 }} />
          }
          {
            checkOut &&
            <TextButtonComponent
              onPress={handleCheckOut}
              backgroundColor={'red'}
              title={'Check Out'}
              position={{ right: 25 }} />
          }
        </View>
      }

      {/* Initial start button Waypoints route starts */}
      {(repStart) &&
        <View style={styles.btnContainer}>
          <TextButtonComponent
            onPress={handleRepStart}
            backgroundColor={'green'}
            title={'Start Journey'}
            position={{ right: '35%', left: '35%' }} />
        </View>
      }

      {/* Bottomsheet enable button */}
      <ImageButtonComponent
        onPress={handleBottomSheet}
        imageSource={require('../../assets/images/menu-bar.png')}
        position={{ right: 35 }} />

      {/* Reset all */}
      <ImageButtonComponent
        onPress={reset}
        imageSource={require('../../assets/images/refresh.png')}
        position={{ left: 35 }} />

      {/* Bottom sheet to check progress */}
      <BottomSheet visible={showBottomSheet} onClose={handleBottomSheet} data={locations}
        completedWaypoints={!repStart ? updateCurrentIndex : 0} />
      {
        loader &&
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={'#blue'} size={40}></ActivityIndicator>
        </View>
      }
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  btnCheckIn: {
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    height: 45,
    width: 100,
    backgroundColor: 'blue',
    position: 'absolute', right: 25
  },
  btnCheckOut: {
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    height: 45,
    width: 100,
    backgroundColor: 'red',
    position: 'absolute', right: 25
  },
  btnRepStart: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    // width: 150,
    padding: 10,
    backgroundColor: 'green',
    position: 'absolute', right: '35%', left: '35%'
  },
  textStyle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#fff'
  },
  btnContainer: {
    position: 'absolute', bottom: 50,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  loaderContainer: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  }
});
