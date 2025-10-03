import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HistoryScreen from '../screens/HistoryScreen';
import TicketDetailsScreen from '../screens/TicketDetailsScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ApiTestScreen from '../screens/ApiTestScreen';


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack Navigator
function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FF0000' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitleVisible: false, // Skriva "HomeMain" tekst
      }}
    >
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="SearchResults" 
        component={SearchResultsScreen}
        options={{
          title: 'Rezultati pretrage',
          headerBackTitle: '', // Prazno umesto "HomeMain"
        }}
      />
      <Stack.Screen 
        name="TicketDetails" 
        component={TicketDetailsScreen}
        options={{
          title: 'Detalji karte',
          headerBackTitle: '',
        }}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{
          headerShown: false, // Jer PaymentScreen ima svoj header
          presentation: 'modal' // iOS stil modal prezentacija
        }}
      />
      <Stack.Screen 
        name="ApiTest" 
        component={ApiTestScreen}
        options={{
          title: 'API Test',
          headerBackTitle: '',
        }}
      />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'History') {
              iconName = focused ? 'time' : 'time-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={24} color={color} />;
          },
          tabBarActiveTintColor: '#FF0000',
          tabBarInactiveTintColor: '#666666',
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeStack} 
          options={{ tabBarLabel: 'Početna' }}
        />
        <Tab.Screen 
          name="History" 
          component={HistoryScreen} 
          options={{ tabBarLabel: 'Istorija' }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ tabBarLabel: 'Profil' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;