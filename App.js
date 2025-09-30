import React from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <>
      <StatusBar backgroundColor="#FF0000" barStyle="light-content" />
      <AppNavigator />
    </>
  );
}