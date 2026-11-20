import * as React from 'react';
import { useNetworkStore } from '@/stores/networkStore';

interface NetworkCanvasProps {
  activations: number[][] | null;
  onNeuronSelect: (layer: number, neuron: number) => void;
  selected: { layer: number; neuron: number } | null;
}

const LAYER_SPACING = 170;
const NEURON_SPACING = 46;
const NEURON_RADIUS = 14;

export function NetworkCanvas({
  activations,
  onNeuronSelect,
  selected,
}: NetworkCanvasProps) {
  const { network } = useNetworkStore();
  if (!network) return null;

  const layerCount = network.layerCount();
  const sizes: number[] = [];
  for (let i = 0; i < layerCount; i++) {
    sizes.push(network.getLayerConfig(i).outputSize);
  }

  const svgWidth = layerCount * LAYER_SPACING + 180;
  const svgHeight = 500;

  return (
    <svg
      className="w-full max-w-[720px] mx-auto"
      width={svgWidth}
      height={svgHeight}
      role="img"
      aria-label="Neural network architecture"
    >
      {sizes.map((toSize, layerIdx) => {
        if (layerIdx === 0) return null;
        const fromSize = sizes[layerIdx - 1];
        const weights = network.getWeights()[layerIdx - 1].weights;
        const x1 = 90 + (layerIdx - 1) * LAYER_SPACING;
        const x2 = 90 + layerIdx * LAYER_SPACING;
        return (
          <g key={layerIdx}>
            {Array.from({ length: fromSize }, (_, i) => {
              const y1 =
                svgHeight / 2 - ((fromSize - 1) * NEURON_SPACING) / 2 +
                i * NEURON_SPACING;
              return Array.from({ length: toSize }, (_, j) => {
                const y2 =
                  svgHeight / 2 - ((toSize - 1) * NEURON_SPACING) / 2 +
                  j * NEURON_SPACING;
                const w = weights[j][i];
                const opacity = Math.min(1, Math.abs(w) * 2.5);
                return (
                  <line
                    key={`${i}-${j}`}
                    x1={x1 + NEURON_RADIUS}
                    y1={y1}
                    x2={x2 - NEURON_RADIUS}
                    y2={y2}
                    stroke={w >= 0 ? '#00f3ff' : '#a855f7'}
                    strokeOpacity={opacity}
                    strokeWidth={Math.max(0.8, 1 + Math.abs(w) * 2)}
                    className="transition-stroke duration-300"
                  />
                );
              });
            })}
          </g>
        );
      })}

      {sizes.map((size, layerIdx) => {
        const x = 90 + layerIdx * LAYER_SPACING;
        const yStart =
          svgHeight / 2 - ((size - 1) * NEURON_SPACING) / 2;
        return (
          <g key={layerIdx}>
            <text
              x={x}
              y={42}
              textAnchor="middle"
              className="text-[10px] fill-synapse-muted font-mono"
            >
              {layerIdx === 0
                ? 'Input'
                : layerIdx === layerCount - 1
                  ? 'Output'
                  : `Hidden ${layerIdx}`}
              {' '}
              ({size})
            </text>
            {Array.from({ length: size }, (_, j) => {
              const y = yStart + j * NEURON_SPACING;
              const isSelected =
                selected?.layer === layerIdx && selected.neuron === j;
              const act = activations?.[layerIdx]?.[j]?.[0];
              const active = act != null;
              const intensity = active
                ? Math.min(1, Math.max(0, act))
                : 0;
              const fill = active
                ? `rgba(0, 243, 255, ${0.2 + 0.8 * intensity})`
                : 'transparent';
              return (
                <circle
                  key={j}
                  cx={x}
                  cy={y}
                  r={NEURON_RADIUS}
                  fill={fill}
                  stroke={isSelected ? '#00f3ff' : '#1f2329'}
                  strokeWidth={isSelected ? 3 : 1.5}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => onNeuronSelect(layerIdx, j)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onNeuronSelect(layerIdx, j);
                    }
                  }}
                  role="button"
                  aria-label={
                    active
                      ? `Neuron ${j} of ${layerIdx === 0 ? 'input' : layerIdx === layerCount - 1 ? 'output' : 'hidden'} layer, activation ${act.toFixed(3)}`
                      : `Neuron ${j} of ${layerIdx === 0 ? 'input' : layerIdx === layerCount - 1 ? 'output' : 'hidden'} layer`
                  }
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export default NetworkCanvas;
