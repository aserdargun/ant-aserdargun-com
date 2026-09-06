import { useEffect, useRef, useState } from 'react';
import { Plus, Minus, Maximize } from 'lucide-react';
import { CanvasRenderer } from '../rendering/canvas';
import type { Layer } from '../rendering/canvas';
import type { SimulationSnapshot } from '../simulation/types';
import type { Copy } from './i18n';

interface Props {
  readSnapshot: () => SimulationSnapshot;
  copy: Copy;
  selected: number | null;
  onSelect: (id: number | null) => void;
  follow: boolean;
  setFollow: (v: boolean) => void;
  sensors: boolean;
}
export function WorldView({
  readSnapshot,
  copy: t,
  selected,
  onSelect,
  follow,
  setFollow,
  sensors,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null),
    renderer = useRef<CanvasRenderer | null>(null);
  const [layer, setLayer] = useState<Layer>('combined');
  const [error, setError] = useState('');
  const drag = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  useEffect(() => {
    try {
      renderer.current = new CanvasRenderer(canvas.current!);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Renderer unavailable.');
    }
    return () => {
      renderer.current?.dispose();
      renderer.current = null;
    };
  }, []);
  useEffect(() => {
    renderer.current?.setSnapshot(readSnapshot());
  }, [readSnapshot]);
  useEffect(() => {
    renderer.current?.setOptions({
      layer,
      selected,
      follow,
      sensors,
      nestLabel: t.nest,
      foodLabel: t.food,
    });
  }, [layer, selected, follow, sensors, t]);
  return (
    <div className="world-view">
      <div className="layer-tabs" role="group" aria-label={t.parameters}>
        {(['natural', 'food', 'home', 'combined'] as Layer[]).map((value) => (
          <button key={value} aria-pressed={layer === value} onClick={() => setLayer(value)}>
            {value === 'food' ? t.foodSignal : value === 'home' ? t.homeSignal : t[value]}
          </button>
        ))}
      </div>
      <div className="canvas-wrap">
        <canvas
          ref={canvas}
          aria-label={t.simDescription}
          role="img"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = {
              x: e.clientX,
              y: e.clientY,
              startX: e.clientX,
              startY: e.clientY,
              moved: false,
            };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 5) d.moved = true;
            if (d.moved) {
              setFollow(false);
              renderer.current?.pan(e.clientX - d.x, e.clientY - d.y);
            }
            d.x = e.clientX;
            d.y = e.clientY;
          }}
          onPointerUp={(e) => {
            const d = drag.current;
            if (d && !d.moved) onSelect(renderer.current?.select(e.clientX, e.clientY) ?? null);
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
        />
        {error && (
          <p className="canvas-error" role="alert">
            {error}
          </p>
        )}
        <div className="camera-controls">
          <button aria-label={t.zoomIn} onClick={() => renderer.current?.zoom(1.25)}>
            <Plus />
          </button>
          <button aria-label={t.zoomOut} onClick={() => renderer.current?.zoom(0.8)}>
            <Minus />
          </button>
          <button
            aria-label={t.fit}
            onClick={() => {
              setFollow(false);
              renderer.current?.fit();
            }}
          >
            <Maximize />
            <span>{t.fit}</span>
          </button>
        </div>
      </div>
      <div className="world-key">
        <span>
          <i className="signal-dot" />
          {t.foodSignal}
        </span>
        <span>
          <i className="signal-ring" />
          {t.homeSignal}
        </span>
        <span className="signal-ramp">
          {t.signalLow}
          <i />
          {t.signalHigh}
        </span>
      </div>
      <p className="canvas-hint">{t.zoomHelp}</p>
      {(layer === 'home' || layer === 'combined') && <p className="home-note">{t.homeNote}</p>}
    </div>
  );
}
