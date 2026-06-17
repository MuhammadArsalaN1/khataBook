import React from 'react';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { COLORS } from '../../constants';

interface Props { data: number[]; width?: number; height?: number; color?: string; }

export default function SparkLine({ data, width = 60, height = 24, color = COLORS.primary }: Props) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 2;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + ((1 - (v - min) / range) * (height - pad * 2));
    return `${x},${y}`;
  }).join(' ');

  const lastX = pad + ((data.length - 1) / (data.length - 1)) * (width - pad * 2);
  const lastY = pad + ((1 - (data[data.length - 1] - min) / range) * (height - pad * 2));

  return (
    <Svg width={width} height={height}>
      <Polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={lastX} cy={lastY} r={2.5} fill={color} />
    </Svg>
  );
}
