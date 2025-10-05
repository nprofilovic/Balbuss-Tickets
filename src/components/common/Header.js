import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SvgUri } from 'react-native-svg';
import { colors } from '../../styles/colors';

const Header = ({
  title,
  showBack = false,
  showMenu = false,
  showProfile = false,
  showLogo = true, // Novo: opcija za prikazivanje logotipa
  onBackPress,
  onMenuPress,
  onProfilePress,
  backgroundColor = colors.primary,
  textColor = colors.textWhite,
  rightComponent,
  style
  
}) => {
  return (
    <>
      <StatusBar backgroundColor={backgroundColor} barStyle="light-content" />
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <View style={[styles.container, { backgroundColor }, style]}>
          {/* Left Side */}
          <View style={styles.leftContainer}>
            {showBack && (
              <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
                <Ionicons name="arrow-back" size={24} color={textColor} />
              </TouchableOpacity>
            )}
            
            {showMenu && (
              <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
                <Ionicons name="menu" size={24} color={textColor} />
              </TouchableOpacity>
            )}
          </View>

          {/* Center - Logo ili Title */}
          <View style={styles.centerContainer}>
            {showLogo ? (
              <Image 
                source={{ uri: 'https://balbuss.rs/wp-content/uploads/2025/07/Beli@Balbuss.png' }}
                style={styles.logo}
                resizeMode="contain"
              />
            ) : (
              <Text style={[styles.title, { color: textColor }]}>{title}</Text>
            )}
          </View>

          {/* Right Side */}
          <View style={styles.rightContainer}>
            {rightComponent}
            
            {showProfile && (
              <TouchableOpacity onPress={onProfilePress} style={styles.iconButton}>
                <Ionicons name="person-circle" size={24} color={textColor} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.primary,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  centerContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textWhite,
    textAlign: 'center',
  },
  logo: {
    width: 150,
    height: 40,
  },
});

export default Header;