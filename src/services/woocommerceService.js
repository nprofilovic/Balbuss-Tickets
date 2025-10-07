import { API_CONFIG } from '../utils/constants';

/**
 * WooCommerce Service - FINALNA VERZIJA
 * 
 * Šalje samo:
 * - bus_id
 * - journey_date (datum koji je korisnik izabrao)
 * - boarding_point (naziv stanice, npr. 'Beograd')
 * - dropping_point (naziv stanice, npr. 'Istanbul')
 * 
 * Backend će sam pronaći vremena iz linije!
 */

/**
 * Add booking to cart
 */
export const addToCart = async (bookingData) => {
  try {
    const { bus, searchData, ticketCount, passengers, returnDate, totalPrice } = bookingData;

    console.log('=== ADD TO CART - FINAL VERSION ===');
    console.log('Bus ID:', bus.id);
    console.log('Selected journey date:', searchData.departureDate);
    console.log('Boarding point:', searchData.from);
    console.log('Dropping point:', searchData.to);

    // ================================================================
    // FINALNO REŠENJE:
    // Šaljemo samo naziv boarding/dropping pointa
    // Backend će pronaći vremena iz WBTM linije!
    // ================================================================

    const requestData = {
      bus_id: bus.id,
      
      // Datum putovanja koji je korisnik izabrao
      journey_date: searchData.departureDate,  // '2025-10-10'
      
      // Samo nazivi stanica - vremena će backend pronaći iz linije
      boarding_point: searchData.from,         // 'Beograd'
      dropping_point: searchData.to,           // 'Istanbul'
      
      // Informacije o putnicima
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
      
      // Datum povratka (ako postoji)
      return_date: returnDate ? returnDate.toISOString().split('T')[0] : null
    };

    console.log('Request data:', requestData);

    const response = await fetch(
      `${API_CONFIG.WORDPRESS_URL}/wp-json/balbuss/v1/bookings/create`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      }
    );

    const result = await response.json();
    console.log('Response:', result);

    if (!result.success) {
      throw new Error(result.message || 'Greška pri kreiranju rezervacije');
    }

    return {
      success: true,
      data: {
        order_id: result.order_id,
        checkout_url: result.checkout_url,
        order_key: result.order_key
      }
    };

  } catch (error) {
    console.error('Add to cart error:', error);
    return {
      success: false,
      message: error.message || 'Greška pri dodavanju u korpu',
      error: error.message
    };
  }
};

// Export default
export default {
  addToCart
};