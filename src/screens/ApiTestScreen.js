// screens/ApiTestScreen.js - Za debugging API problema

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { 
  testApiConnection, 
  checkWordPressUrl 
} from '../services/woocommerceService';
import { API_CONFIG, WORDPRESS_URL } from '../utils/constants';

const ApiTestScreen = ({ navigation }) => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);
  const [customUrl, setCustomUrl] = useState(WORDPRESS_URL);

  const addResult = (test, success, message, details = null) => {
    setResults(prev => [...prev, {
      test,
      success,
      message,
      details,
      timestamp: new Date().toISOString()
    }]);
  };

  const runAllTests = async () => {
    setTesting(true);
    setResults([]);

    // Test 1: Check WordPress URL
    addResult('WordPress URL', null, 'Testiranje...');
    try {
      const urlCheck = await checkWordPressUrl();
      addResult(
        'WordPress URL',
        urlCheck.accessible,
        urlCheck.accessible 
          ? `URL je dostupan (Status: ${urlCheck.status})`
          : `URL nije dostupan: ${urlCheck.error}`,
        urlCheck
      );
    } catch (error) {
      addResult('WordPress URL', false, error.message);
    }

    // Test 2: Test REST API
    addResult('REST API', null, 'Testiranje...');
    try {
      const apiTest = await testApiConnection();
      addResult(
        'REST API',
        apiTest.success,
        apiTest.message,
        apiTest.data
      );
    } catch (error) {
      addResult('REST API', false, error.message);
    }

    // Test 3: Check Balbuss endpoint
    addResult('Balbuss Endpoint', null, 'Testiranje...');
    try {
      const balbussUrl = `${API_CONFIG.BASE_URL}/balbuss/v1`;
      const response = await fetch(balbussUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      addResult(
        'Balbuss Endpoint',
        response.ok,
        response.ok 
          ? 'Balbuss endpoints su dostupni'
          : `HTTP ${response.status}: Endpoint nije dostupan`,
        { status: response.status, url: balbussUrl }
      );
    } catch (error) {
      addResult('Balbuss Endpoint', false, error.message);
    }

    setTesting(false);
  };

  const renderResult = (result, index) => {
    const icon = result.success === null 
      ? 'time' 
      : result.success 
        ? 'checkmark-circle' 
        : 'close-circle';
    
    const iconColor = result.success === null
      ? colors.textSecondary
      : result.success
        ? colors.success || '#28a745'
        : colors.error;

    return (
      <View key={index} style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Ionicons name={icon} size={24} color={iconColor} />
          <Text style={styles.resultTitle}>{result.test}</Text>
        </View>
        <Text style={styles.resultMessage}>{result.message}</Text>
        {result.details && (
          <View style={styles.resultDetails}>
            <Text style={styles.detailsTitle}>Detalji:</Text>
            <Text style={styles.detailsText}>
              {JSON.stringify(result.details, null, 2)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>API Test</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Current Configuration */}
        <View style={styles.configCard}>
          <Text style={styles.sectionTitle}>Trenutna konfiguracija</Text>
          
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>WordPress URL:</Text>
            <Text style={styles.configValue}>{WORDPRESS_URL}</Text>
          </View>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>REST API Base:</Text>
            <Text style={styles.configValue}>{API_CONFIG.BASE_URL}</Text>
          </View>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Bookings Endpoint:</Text>
            <Text style={styles.configValue}>
              {API_CONFIG.BASE_URL}{API_CONFIG.ENDPOINTS.BOOKINGS}
            </Text>
          </View>
        </View>

        {/* Test Button */}
        <TouchableOpacity
          style={[styles.testButton, testing && styles.testButtonDisabled]}
          onPress={runAllTests}
          disabled={testing}
        >
          {testing ? (
            <>
              <ActivityIndicator color={colors.textWhite} size="small" />
              <Text style={styles.testButtonText}>Testiranje...</Text>
            </>
          ) : (
            <>
              <Ionicons name="flash" size={20} color={colors.textWhite} />
              <Text style={styles.testButtonText}>Pokreni sve testove</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Instructions */}
        {results.length === 0 && (
          <View style={styles.instructionsCard}>
            <Ionicons name="information-circle" size={32} color={colors.primary} />
            <Text style={styles.instructionsTitle}>
              Kako ispraviti "Network request failed"
            </Text>
            <Text style={styles.instructionsText}>
              1. Otvorite utils/constants.js{'\n'}
              2. Promenite WORDPRESS_URL na vaš pravi URL{'\n'}
              3. Primer: 'https://vasa-domena.com'{'\n'}
              4. Za lokalni development: 'http://192.168.1.X'{'\n'}
              5. Sačuvajte i restartujte aplikaciju
            </Text>
          </View>
        )}

        {/* Results */}
        {results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>Rezultati testova</Text>
            {results.map((result, index) => renderResult(result, index))}
          </View>
        )}

        {/* Custom URL Test */}
        <View style={styles.customTestCard}>
          <Text style={styles.sectionTitle}>Testiranje custom URL-a</Text>
          <TextInput
            style={styles.urlInput}
            placeholder="https://vasa-domena.com"
            value={customUrl}
            onChangeText={setCustomUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.customTestButton}
            onPress={async () => {
              setTesting(true);
              try {
                const response = await fetch(customUrl, {
                  method: 'HEAD',
                  timeout: 5000
                });
                addResult(
                  'Custom URL Test',
                  response.ok,
                  response.ok ? 'URL je dostupan!' : 'URL nije dostupan',
                  { status: response.status }
                );
              } catch (error) {
                addResult('Custom URL Test', false, error.message);
              }
              setTesting(false);
            }}
          >
            <Text style={styles.customTestButtonText}>Test URL</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingVertical: 15,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  configCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  configRow: {
    marginBottom: 12,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  configValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  testButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  instructionsCard: {
    backgroundColor: `${colors.primary}15`,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  resultsContainer: {
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  resultMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  resultDetails: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  customTestCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  urlInput: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
  }
});

  export default ApiTestScreen;