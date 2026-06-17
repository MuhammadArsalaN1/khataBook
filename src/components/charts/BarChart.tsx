import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../../constants';

interface Bar { label: string; value: number; color?: string; }

interface Props {
  data: Bar[];
  height?: number;
  width?: number;
  showValues?: boolean;
  highlightLast?: boolean;
}

export default function BarChart({ data, height = 140, width, showValues = true, highlightLast = true }: Props) {
  const W = width ?? Dimensions.get('window').width - 64;
  const padH = 24;
  const padV = showValues ? 28 : 16;
  const chartW = W - padH * 2;
  const chartH = height - padV - 20;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.floor(chartW / data.length) - 6;

  return (
    <View style={{ width: W, height }}>
      <Svg width={W} height={height}>
        {/* Baseline */}
        <Line x1={padH} y1={padV + chartH} x2={W - padH} y2={padV + chartH} stroke={COLORS.border} strokeWidth={1} />

        {data.map((d, i) => {
          const barH = max > 0 ? (d.value / max) * chartH : 0;
          const x = padH + i * (chartW / data.length) + (chartW / data.length - barW) / 2;
          const y = padV + chartH - barH;
          const isLast = i === data.length - 1;
          const color = d.color ?? (highlightLast && isLast ? COLORS.primary : COLORS.primaryLight);

          return (
            <React.Fragment key={i}>
              <Rect
                x={x} y={y}
                width={barW} height={Math.max(barH, 2)}
                rx={4} fill={color}
                opacity={highlightLast && !isLast ? 0.5 : 1}
              />
              {showValues && d.value > 0 && (
                <SvgText
                  x={x + barW / 2} y={y - 4}
                  textAnchor="middle" fontSize={8}
                  fill={COLORS.textLight}
                >
                  {d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}k` : d.value}
                </SvgText>
              )}
              <SvgText
                x={x + barW / 2} y={padV + chartH + 14}
                textAnchor="middle" fontSize={9}
                fill={highlightLast && isLast ? COLORS.primary : COLORS.textLight}
                fontWeight={highlightLast && isLast ? 'bold' : 'normal'}
              >
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
