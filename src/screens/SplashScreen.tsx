import { StyleSheet } from 'react-native'
import React, { useEffect, useRef } from 'react';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { StackNavigationProp } from '@react-navigation/stack';

type SplashScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SplashScreen'
>;

const SplashScreen = () => {
  const animationRef = useRef<LottieView>(null);
  const navigation = useNavigation<SplashScreenNavigationProp>();
  useEffect(() => {
    console.log('Reached')
    animationRef.current?.play();
    const timeout = setTimeout(() => {
      navigation.replace('HomeScreen');
    }, 4000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <LottieView
      style={styles.container}
      ref={animationRef}
      source={require('../assets/Splash.json')}
    />
  );
}

export default SplashScreen

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  }
})