import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated
} from 'react-native';
import { colors } from '../styles/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 40; // 20px padding on each side
const BANNER_HEIGHT = 150;

const BannerSlider = ({ banners, onBannerPress }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Auto-scroll effect
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % banners.length;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * BANNER_WIDTH,
        animated: true
      });
      setCurrentIndex(nextIndex);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, [currentIndex, banners.length]);

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / BANNER_WIDTH);
    setCurrentIndex(index);
  };

  const handleBannerPress = (banner) => {
    if (onBannerPress) {
      onBannerPress(banner);
    }
  };

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH}
        contentContainerStyle={styles.scrollContent}
      >
        {banners.map((banner, index) => (
          <TouchableOpacity
            key={banner.id}
            style={styles.bannerContainer}
            onPress={() => handleBannerPress(banner)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: banner.image_url }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            {(banner.title || banner.description) && (
              <View style={styles.bannerOverlay}>
                {banner.title && (
                  <Text style={styles.bannerTitle} numberOfLines={1}>
                    {banner.title}
                  </Text>
                )}
                {banner.description && (
                  <Text style={styles.bannerDescription} numberOfLines={2}>
                    {banner.description}
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      {banners.length > 1 && (
        <View style={styles.pagination}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 0,
    backgroundColor: colors.backgroundGray,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginBottom: 2,
  },
  bannerDescription: {
    fontSize: 13,
    color: colors.textWhite,
    opacity: 0.9,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
});

export default BannerSlider;