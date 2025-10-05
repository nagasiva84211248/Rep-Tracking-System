import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from './src/screens/home';
import SplashScreen from './src/screens/SplashScreen';
import { IStartTimeEndTimeDistance } from './src/screens/home/types';
import SummaryScreen from './src/screens/summary';

export type RootStackParamList = {
  SplashScreen: undefined;
  HomeScreen: undefined;
  SummaryScreen: { summaryData: IStartTimeEndTimeDistance };
};

const RootStack = createStackNavigator<RootStackParamList>();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <RootStack.Navigator initialRouteName="SplashScreen">
          <RootStack.Screen name="SplashScreen" component={SplashScreen} options={{ headerShown: false }} />
          <RootStack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
          <RootStack.Screen name="SummaryScreen" component={SummaryScreen} options={{ headerTitle: '' }} />
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
