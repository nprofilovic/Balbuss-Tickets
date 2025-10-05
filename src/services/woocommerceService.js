// services/woocommerceService.js - FIXED VERSION

import { API_CONFIG, WORDPRESS_URL } from '../utils/constants';

/**
 * OPCIJA 1: Direktno dodavanje u WooCommerce korpu (bez custom endpoint-a)
 * Koristi standardni WooCommerce REST API
 */
export const addToCartDirect = async (bookingData) => {
  try {
    const { bus, ticketCount, passengers, searchData, returnDate, totalPrice } = bookingData;

    // Koristimo WooCommerce Products API da dodamo proizvod u korpu
    const productData = {
      product_id: bus.id,
      quantity: ticketCount,
      // Meta data za booking informacije
      meta_data: [
        { key: '_from', value: searchData.from },
        { key: '_to', value: searchData.to },
        { key: '_departure_date', value: searchData.departureDate },
        { key: '_departure_time', value: bus.departure },
        { key: '_arrival_time', value: bus.arrival },
        { key: '_passengers', value: JSON.stringify(passengers) },
        { key: '_return_date', value: returnDate ? returnDate.toISOString() : null },
        { key: '_total_price', value: totalPrice }
      ]
    };

    console.log('=== ADDING TO WC CART ===');
    console.log('Product Data:', productData);

    // WooCommerce Store API endpoint
    const response = await fetch(`${WORDPRESS_URL}/wp-json/wc/store/v1/cart/add-item`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        id: bus.id,
        quantity: ticketCount
      }),
    });

    console.log('Response Status:', response.status);
    const result = await response.json();
    console.log('Response:', result);

    if (!response.ok) {
      throw new Error(result.message || 'Greška pri dodavanju u korpu');
    }

    return {
      success: true,
      data: {
        cart_key: result.key || null,
        checkout_url: `${WORDPRESS_URL}/checkout`,
        cart_item_key: result.item_key
      }
    };

  } catch (error) {
    console.error('Add to Cart Error:', error);
    return {
      success: false,
      message: error.message || 'Greška pri dodavanju u korpu',
      error: error.message
    };
  }
};

/**
 * OPCIJA 2: Kreiranje WooCommerce narudžbine direktno
 * Zaobilazi korpu i kreira order odmah
 */
export const createWooCommerceOrder = async (bookingData) => {
  try {
    const { bus, ticketCount, passengers, searchData, returnDate, totalPrice } = bookingData;

    const orderData = {
      status: 'pending',
      billing: {
        first_name: passengers[0].fullName.split(' ')[0] || '',
        last_name: passengers[0].fullName.split(' ')[1] || '',
        phone: passengers[0].phone,
        email: passengers[0].email || 'booking@balbuss.rs'
      },
      line_items: [
        {
          product_id: bus.id,
          quantity: ticketCount,
          meta_data: [
            { key: 'Polazak', value: searchData.from },
            { key: 'Destinacija', value: searchData.to },
            { key: 'Datum polaska', value: searchData.departureDate },
            { key: 'Vreme polaska', value: bus.departure },
            { key: 'Vreme dolaska', value: bus.arrival },
            { key: 'Putnici', value: passengers.map(p => p.fullName).join(', ') },
            { key: 'Povratak', value: returnDate || 'Nema' }
          ]
        }
      ],
      meta_data: [
        { key: '_booking_data', value: JSON.stringify(bookingData) },
        { key: '_passengers_info', value: JSON.stringify(passengers) }
      ]
    };

    console.log('=== CREATING WC ORDER ===');
    console.log('Order Data:', orderData);

    // Ovo zahteva WooCommerce API autentikaciju
    // Morate imati Consumer Key i Consumer Secret
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.WC_ORDERS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // TODO: Dodati autentikaciju
        // 'Authorization': 'Basic ' + base64(consumer_key:consumer_secret)
      },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();
    console.log('Order Response:', result);

    if (!response.ok) {
      throw new Error(result.message || 'Greška pri kreiranju narudžbine');
    }

    return {
      success: true,
      data: {
        order_id: result.id,
        order_number: result.number,
        checkout_url: `${WORDPRESS_URL}/checkout/order-pay/${result.id}/?key=${result.order_key}`,
        order_key: result.order_key
      }
    };

  } catch (error) {
    console.error('Create Order Error:', error);
    return {
      success: false,
      message: error.message || 'Greška pri kreiranju narudžbine',
      error: error.message
    };
  }
};

/**
 * OPCIJA 3: Custom endpoint (zahteva backend kod)
 * Ovo će raditi samo ako kreirate odgovarajući PHP endpoint
 */
export const addToCart = async (bookingData) => {
  try {
    const { bus, searchData, ticketCount, passengers, returnDate, totalPrice } = bookingData;

    // Format podataka za /bookings/create endpoint
    const requestData = {
      bus_id: bus.id,
      journey_date: searchData.departureDate,
      boarding_point: searchData.from,
      boarding_time: `${searchData.departureDate} ${bus.departure || '00:00'}`,
      dropping_point: searchData.to,
      dropping_time: `${searchData.departureDate} ${bus.arrival || '23:59'}`,
      passenger_info: passengers.map((p, index) => ({
        passenger_number: index + 1,
        full_name: p.fullName,
        phone: p.phone,
        email: p.email || '',
        passport: p.passport || '',
        description: p.description || ''
      })),
      ticket_count: ticketCount,
      total_price: totalPrice,
      return_date: returnDate ? returnDate.toISOString().split('T')[0] : null
    };

    // Koristi POSTOJEĆI endpoint: /bookings/create
    let apiUrl = `${API_CONFIG.BASE_URL}/balbuss/v1/bookings/create`;
    
    console.log('=== CALLING BOOKING CREATE ENDPOINT ===');
    console.log('URL:', apiUrl);
    console.log('Data:', JSON.stringify(requestData, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    console.log('Response Status:', response.status);
    const result = await response.json();
    console.log('API Response:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      throw new Error(result.message || `HTTP Error: ${response.status}`);
    }

    // Backend vraća order sa payment_url ili checkout_url
    return {
      success: true,
      data: {
        order_id: result.order_id || result.data?.order_id,
        checkout_url: result.payment_url || result.checkout_url || result.data?.checkout_url || result.data?.payment_url,
        order_key: result.order_key || result.data?.order_key
      }
    };

  } catch (error) {
    console.error('=== BOOKING CREATE ERROR ===');
    console.error('Error:', error.message);
    
    return {
      success: false,
      message: error.message || 'Greška pri kreiranju rezervacije',
      error: error.message
    };
  }
};

/**
 * Test funkcija - proveri koji endpoint radi
 */
export const testEndpoints = async () => {
  const endpoints = [
    `${WORDPRESS_URL}/wp-json`,
    `${WORDPRESS_URL}/wp-json/wc/store/v1/cart`,
    `${API_CONFIG.BASE_URL}/balbuss/v1/bookings`,
    `${API_CONFIG.BASE_URL}/balbuss/v1/lines`
  ];

  console.log('=== TESTING ENDPOINTS ===');
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      console.log(`✓ ${endpoint}: ${response.status}`);
    } catch (error) {
      console.log(`✗ ${endpoint}: ${error.message}`);
    }
  }
};

/**
 * Get order status
 */
export const getOrderStatus = async (orderId) => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/balbuss/v1/bookings/order/${orderId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to get order status');
    }

    return {
      success: true,
      data: result.data || result
    };

  } catch (error) {
    console.error('Error getting order status:', error);
    return {
      success: false,
      message: error.message || 'Greška pri proveri statusa narudžbine'
    };
  }
};