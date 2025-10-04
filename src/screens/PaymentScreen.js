import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

const PaymentScreen = ({ route, navigation }) => {
  const { checkoutUrl } = route.params;
  const [webViewUrl, setWebViewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [webViewKey, setWebViewKey] = useState(Date.now());

  useEffect(() => {
    prepareCheckoutUrl();
  }, []);

  const prepareCheckoutUrl = async () => {
    try {
        const userToken = await AsyncStorage.getItem('userToken');
        
        let url = checkoutUrl;
        
        if (userToken) {
        url = `${checkoutUrl}?jwt_token=${userToken}&hide_header=1`;
        } else {
        url = `${checkoutUrl}?hide_header=1&clear_cookies=1`;
        setWebViewKey(Date.now()); // Force reload WebView
        }
        
        setWebViewUrl(url);
    } catch (error) {
        console.error('Error preparing checkout URL:', error);
        setWebViewUrl(checkoutUrl);
    }
  };

  const handleNavigationStateChange = (navState) => {
    // Detektuj kada se plaćanje završi
    if (navState.url.includes('order-received') || navState.url.includes('thank-you')) {
      Alert.alert(
        'Uspešno plaćanje',
        'Vaša rezervacija je potvrđena!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    }
  };

  if (!webViewUrl) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Priprema plaćanja...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plaćanje</Text>
        <View style={styles.placeholder} />
      </View>

      {/* WebView */}
      <WebView
        source={{ uri: webViewUrl }}
        sharedCookiesEnabled={false}  // Dodato
        thirdPartyCookiesEnabled={false}  // Dodato
        injectedJavaScript={`
            (function() {
            const urlParams = new URLSearchParams(window.location.search);
            
            // Ako je clear_cookies=1, obriši SVE cookies i storage
            if (urlParams.get('clear_cookies') === '1') {
                // Obriši sve cookies
                document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                });
                
                // Obriši storage
                localStorage.clear();
                sessionStorage.clear();
                
                // Dodatno - eksplicitno obriši jwt_token cookie
                document.cookie = 'jwt_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                document.cookie = 'wordpress_logged_in=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                
                console.log('Cookies cleared!');
            } else {
                // Sačuvaj JWT token ako postoji
                const jwtToken = urlParams.get('jwt_token');
                if (jwtToken) {
                localStorage.setItem('jwt_token', jwtToken);
                document.cookie = 'jwt_token=' + jwtToken + '; path=/; max-age=604800';
                console.log('JWT token set!');
                }
            }
            
            // Sakrij header i footer
            setTimeout(function() {
                const style = document.createElement('style');
                style.innerHTML = \`
                #site-header, .site-header, #page-header,
                .page-header-wrapper, #top-area, .top-area,
                #primary-navigation, .gem-header, .header-main,
                .mobile-header, #site-footer, .site-footer,
                .footer-wrapper, header, footer, nav,
                .breadcrumbs, .woocommerce-breadcrumb, .back-to-top {
                    display: none !important;
                    height: 0 !important;
                    visibility: hidden !important;
                }
                body, html {
                    padding-top: 0 !important;
                    margin-top: 0 !important;
                }
                #main-content, .main-content-wrapper, #content {
                    padding-top: 20px !important;
                }
                \`;
                document.head.appendChild(style);
            }, 100);
            
            })();
            true;
        `}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error: ', nativeEvent);
            Alert.alert('Greška', 'Nije moguće učitati stranicu za plaćanje');
        }}
        />

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  backButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});

export default PaymentScreen;