import { useEffect, useRef, useState } from 'react';
import { Plus, Minus, Maximize } from 'lucide-react';
import { CanvasRenderer } from '../rendering/canvas';
import type { Layer } from '../rendering/canvas';
import type { SimulationSnapshot } from '../simulation/types';
import type { Copy } from './i18n';
import { TermHelp } from './TermHelp';

interface Props {
  resetRevision: number;
  readSnapshot: () => SimulationSnapshot;
  copy: Copy;
  selected: number | null;
  onSelect: (id: number | null) => void;
  follow: boolean;
  setFollow: (v: boolean) => void;
  sensors: boolean;
}
export function WorldView({
  resetRevision,
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
  const pointers = useRef(
    new Map<
      number,
      {
        x: number;
        y: number;
        startX: number;
        startY: number;
        moved: boolean;
      }
    >(),
  );
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
    renderer.current?.fit();
  }, [resetRevision]);
  useEffect(() => {
    renderer.current?.setOptions({
      layer,
      selected,
      follow,
      sensors,
      nestLabel: t.nest,
      foodLabel: t.food,
      locale: t.locale,
    });
  }, [layer, selected, follow, sensors, t]);
  return (
    <div className="world-view">
      <div className="layer-tabs" role="group" aria-label={t.layers}>
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
          tabIndex={0}
          onKeyDown={(e) => {
            const directions: Record<string, [number, number]> = {
              ArrowLeft: [40, 0],
              ArrowRight: [-40, 0],
              ArrowUp: [0, 40],
              ArrowDown: [0, -40],
            };
            const pan = directions[e.key];
            if (!pan && !['+', '=', '-', 'Home'].includes(e.key)) return;
            e.preventDefault();
            setFollow(false);
            if (pan) renderer.current?.pan(pan[0], pan[1]);
            else if (e.key === 'Home') renderer.current?.fit();
            else renderer.current?.zoom(e.key === '-' ? 0.8 : 1.25);
          }}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            pointers.current.set(e.pointerId, {
              x: e.clientX,
              y: e.clientY,
              startX: e.clientX,
              startY: e.clientY,
              moved: false,
            });
            if (pointers.current.size > 1)
              pointers.current.forEach((pointer) => {
                pointer.moved = true;
              });
          }}
          onPointerMove={(e) => {
            const d = pointers.current.get(e.pointerId);
            if (!d) return;
            const other = [...pointers.current.entries()].find(([id]) => id !== e.pointerId)?.[1];
            if (other) {
              const before = Math.hypot(d.x - other.x, d.y - other.y);
              const after = Math.hypot(e.clientX - other.x, e.clientY - other.y);
              setFollow(false);
              if (before > 0 && after > 0)
                renderer.current?.zoom(after / before, (d.x + other.x) / 2, (d.y + other.y) / 2);
              renderer.current?.pan((e.clientX - d.x) / 2, (e.clientY - d.y) / 2);
              d.x = e.clientX;
              d.y = e.clientY;
              return;
            }
            if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 5) d.moved = true;
            if (d.moved) {
              setFollow(false);
              renderer.current?.pan(e.clientX - d.x, e.clientY - d.y);
            }
            d.x = e.clientX;
            d.y = e.clientY;
          }}
          onPointerUp={(e) => {
            const d = pointers.current.get(e.pointerId);
            if (d && !d.moved) onSelect(renderer.current?.select(e.clientX, e.clientY) ?? null);
            pointers.current.delete(e.pointerId);
            if (e.currentTarget.hasPointerCapture(e.pointerId))
              e.currentTarget.releasePointerCapture(e.pointerId);
          }}
          onPointerCancel={(e) => {
            pointers.current.delete(e.pointerId);
          }}
          onLostPointerCapture={(e) => {
            pointers.current.delete(e.pointerId);
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
          <TermHelp term="foodSignal" label={t.foodSignal} />
        </span>
        <span>
          <i className="signal-ring" />
          {t.homeSignal}
          <TermHelp term="homeSignal" label={t.homeSignal} />
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
