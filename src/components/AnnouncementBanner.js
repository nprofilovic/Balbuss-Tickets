import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

const AnnouncementBanner = ({ announcements }) => {
  if (!announcements || announcements.length === 0) {
    return null;
  }

  // Map icon names to Ionicons
  const getIconName = (icon) => {
    const iconMap = {
      'information-circle': 'information-circle',
      'star': 'star',
      'gift': 'gift',
      'alert-circle': 'alert-circle',
      'checkmark-circle': 'checkmark-circle',
      'megaphone': 'megaphone',
      'notifications': 'notifications',
      'sparkles': 'sparkles'
    };
    return iconMap[icon] || 'information-circle';
  };

  return (
    <View style={styles.container}>
      {announcements.map((announcement) => (
        <View
          key={announcement.id}
          style={[
            styles.announcementItem,
            { backgroundColor: `${announcement.color}15` }
          ]}
        >
          <Ionicons
            name={getIconName(announcement.icon)}
            size={20}
            color={announcement.color}
            style={styles.icon}
          />
          <Text
            style={[styles.text, { color: announcement.color }]}
            numberOfLines={2}
          >
            {announcement.text}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 5,
  },
  announcementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AnnouncementBanner;