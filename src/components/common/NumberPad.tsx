import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';
import { responsiveFontSize, responsiveSpacing } from '../../utils/responsive';

interface NumberPadProps {
  value: string;
  onChange: (value: string) => void;
  onDone?: () => void;
  onClear?: () => void;
}

export default function NumberPad({ value, onChange, onDone, onClear }: NumberPadProps) {
  const handlePress = (num: string) => {
    if (num === '.') {
      if (!value.includes('.')) onChange(value + num);
    } else if (num === '0' && value === '0') {
      return;
    } else {
      onChange(value === '0' ? num : value + num);
    }
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1) || '0');
  };

  const buttons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', '⌫'],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.display}>
        <Text style={styles.displayText}>{value}</Text>
      </View>

      <View style={styles.grid}>
        {buttons.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((btn) => (
              <TouchableOpacity
                key={btn}
                style={styles.btn}
                onPress={() => {
                  if (btn === '⌫') handleBackspace();
                  else handlePress(btn);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.btnText}>{btn}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.actionRow}>
        {onClear && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.clearBtn]}
            onPress={onClear}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Clear</Text>
          </TouchableOpacity>
        )}
        {onDone && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.doneBtn]}
            onPress={onDone}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: COLORS.white }]}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: responsiveSpacing(16),
    paddingBottom: responsiveSpacing(16),
  },
  display: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 14,
    paddingHorizontal: responsiveSpacing(16),
    paddingVertical: responsiveSpacing(14),
    marginBottom: responsiveSpacing(16),
    borderWidth: 0,
  },
  displayText: {
    fontSize: responsiveFontSize(36),
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  grid: {
    gap: 10,
    marginBottom: responsiveSpacing(14),
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    height: 58,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  btnText: {
    fontSize: responsiveFontSize(20),
    fontWeight: '600',
    color: COLORS.text,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    backgroundColor: COLORS.dangerLight,
  },
  doneBtn: {
    backgroundColor: COLORS.primary,
  },
  actionBtnText: {
    fontSize: responsiveFontSize(14),
    fontWeight: '700',
  },
});
