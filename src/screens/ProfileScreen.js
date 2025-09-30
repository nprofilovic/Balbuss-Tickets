import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '../styles/colors';

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>Profile Screen - Implementacija u toku</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 60 : 15,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});

export default ProfileScreen;