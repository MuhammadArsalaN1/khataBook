import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { WalletBrand } from '../../constants';

/**
 * Renders a brand-styled wordmark so each wallet card reads like the real card
 * (PayPal / Payoneer / JazzCash), without needing logo image assets.
 */
export default function BrandMark({ brand, size = 18 }: { brand: WalletBrand; size?: number }) {
  if (brand === 'paypal') {
    return (
      <Text style={[styles.italic, { fontSize: size }]}>
        <Text style={{ color: '#fff' }}>Pay</Text>
        <Text style={{ color: '#FACC15' }}>Pal</Text>
      </Text>
    );
  }
  if (brand === 'payoneer') {
    return <Text style={[styles.bold, { fontSize: size, color: '#fff' }]}>payoneer</Text>;
  }
  if (brand === 'jazzcash') {
    return (
      <View style={styles.jazzWrap}>
        <Text style={[styles.bold, { fontSize: size, color: '#fff' }]}>Jazz</Text>
        <Text style={[styles.bold, { fontSize: size, color: '#FFD400' }]}>Cash</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  italic: { fontWeight: '800', fontStyle: 'italic', letterSpacing: -0.5 },
  bold: { fontWeight: '800', letterSpacing: -0.3 },
  jazzWrap: { flexDirection: 'row' },
});
