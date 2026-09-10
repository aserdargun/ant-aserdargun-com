import { Camera } from './camera';
import type { Ant, SimulationSnapshot } from '../simulation/types';

export type Layer = 'natural' | 'food' | 'home' | 'combined';
export interface RenderOptions {
  layer: Layer;
  selected: number | null;
  follow: boolean;
  sensors: boolean;
  nestLabel: string;
  foodLabel: string;
  locale: string;
}

/** Presentation adapter. Never mutates a snapshot or decides an agent action. */
export class CanvasRenderer {
  readonly camera = new Camera();
  private context: CanvasRenderingContext2D;
  private fieldCanvas = document.createElement('canvas');
  private fieldImage: ImageData | null = null;
  private snapshot: SimulationSnapshot | null = null;
  private options: RenderOptions = {
    layer: 'combined',
    selected: null,
    follow: false,
    sensors: false,
    nestLabel: 'Nest',
    foodLabel: 'Food',
    locale: 'en-US',
  };
  private resize: ResizeObserver;
  private width = 0;
  private height = 0;
  private frame = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas 2D is unavailable in this browser.');
    this.context = context;
    this.resize = new ResizeObserver(() => {
      const { width, height } = canvas.getBoundingClientRect();
      this.width = width;
      this.height = height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const pixelsWide = Math.round(width * dpr),
        pixelsHigh = Math.round(height * dpr);
      if (canvas.width !== pixelsWide) canvas.width = pixelsWide;
      if (canvas.height !== pixelsHigh) canvas.height = pixelsHigh;
      this.invalidate();
    });
    this.resize.observe(canvas);
    this.invalidate();
  }
  private invalidate() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.draw();
    });
  }
  setSnapshot(snapshot: SimulationSnapshot) {
    const before = this.snapshot?.config.world,
      after = snapshot.config.world;
    if (
      !before ||
      before.width !== after.width ||
      before.height !== after.height ||
      snapshot.tick < this.snapshot!.tick
    )
      this.camera.fit(after.width, after.height);
    this.snapshot = snapshot;
    this.heatmap();
    this.invalidate();
  }
  setOptions(options: RenderOptions) {
    const changedLayer = this.options.layer !== options.layer;
    this.options = options;
    if (changedLayer) this.heatmap();
    this.invalidate();
  }
  zoom(factor: number, clientX?: number, clientY?: number) {
    const before = this.scale();
    if (!Number.isFinite(factor) || factor <= 0 || before <= 0) return;
    this.camera.zoomBy(factor);
    if (clientX !== undefined && clientY !== undefined) {
      const box = this.canvas.getBoundingClientRect();
      const delta = 1 / before - 1 / this.scale();
      this.camera.x += (clientX - box.left - this.width / 2) * delta;
      this.camera.y += (clientY - box.top - this.height / 2) * delta;
    }
    this.invalidate();
  }
  fit() {
    if (this.snapshot)
      this.camera.fit(this.snapshot.config.world.width, this.snapshot.config.world.height);
    this.invalidate();
  }
  pan(dx: number, dy: number) {
    const scale = this.scale();
    if (!Number.isFinite(scale) || scale <= 0) return;
    this.camera.x -= dx / scale;
    this.camera.y -= dy / scale;
    this.invalidate();
  }
  select(clientX: number, clientY: number): number | null {
    if (!this.snapshot) return null;
    const box = this.canvas.getBoundingClientRect(),
      scale = this.scale();
    const x = (clientX - box.left - this.width / 2) / scale + this.camera.x;
    const y = (clientY - box.top - this.height / 2) / scale + this.camera.y;
    let selected: number | null = null,
      best = 18 / scale;
    for (const ant of this.snapshot.ants) {
      const d = Math.hypot(ant.x - x, ant.y - y);
      if (d < best) {
        best = d;
        selected = ant.id;
      }
    }
    return selected;
  }
  dispose() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.resize.disconnect();
  }
  private scale() {
    const w = this.snapshot?.config.world;
    return w ? this.camera.scale(this.width, this.height, w.width, w.height) : 1;
  }

  private heatmap() {
    const s = this.snapshot;
    if (!s || this.options.layer === 'natural') return;
    const { columns, rows, home, food } = s.fields;
    if (this.fieldCanvas.width !== columns) this.fieldCanvas.width = columns;
    if (this.fieldCanvas.height !== rows) this.fieldCanvas.height = rows;
    const context = this.fieldCanvas.getContext('2d');
    if (!context) return;
    if (this.fieldImage?.width !== columns || this.fieldImage.height !== rows)
      this.fieldImage = context.createImageData(columns, rows);
    const data = this.fieldImage,
      p = data.data;
    p.fill(0);
    for (let i = 0; i < home.length; i++) {
      const f = this.options.layer === 'home' ? 0 : food[i];
      const h = this.options.layer === 'food' ? 0 : home[i];
      const total = f + h;
      if (total < 0.025) continue;
      const ratio = f / total;
      p[i * 4] = 151 + ratio * 86;
      p[i * 4 + 1] = 200 - ratio * 32;
      p[i * 4 + 2] = 160 - ratio * 96;
      p[i * 4 + 3] = Math.min(190, (Math.log1p(total) / Math.log(101)) * 190);
    }
    context.putImageData(data, 0, 0);
  }

  private draw() {
    const s = this.snapshot,
      ctx = this.context;
    if (!s || !this.width || !this.height) return;
    const { world } = s.config;
    const selected = this.options.selected === null ? undefined : s.ants[this.options.selected];
    if (selected && this.options.follow) {
      this.camera.x = selected.x;
      this.camera.y = selected.y;
      this.camera.zoom = Math.max(this.camera.zoom, 2.4);
    }
    const dpr = this.canvas.width / this.width;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#111c19';
    ctx.fillRect(0, 0, this.width, this.height);
    const scale = this.scale();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-this.camera.x, -this.camera.y);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, world.width, world.height);
    ctx.clip();
    if (this.options.layer !== 'natural') {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.fieldCanvas, 0, 0, world.width, world.height);
    }
    ctx.lineWidth = 0.6 / scale;
    ctx.strokeStyle = '#334238';
    ctx.setLineDash([3 / scale, 7 / scale]);
    for (let x = 0; x <= world.width; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, world.height);
      ctx.stroke();
    }
    for (let y = 0; y <= world.height; y += 120) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(world.width, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (const obstacle of world.obstacles) {
      ctx.fillStyle = '#343e37';
      ctx.strokeStyle = '#566057';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#465047';
      for (let k = 1; k <= 4; k++) {
        ctx.beginPath();
        ctx.ellipse(
          obstacle.x - k * 1.3,
          obstacle.y - k * 1.5,
          obstacle.radius * (1 - k * 0.17),
          obstacle.radius * (1 - k * 0.18),
          -0.4,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
    }
    const nest = world.nest;
    ctx.fillStyle = '#26392c';
    ctx.beginPath();
    ctx.arc(nest.x, nest.y, nest.radius + 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8aa57e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(nest.x, nest.y, nest.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#0b120f';
    ctx.beginPath();
    ctx.arc(nest.x, nest.y, nest.radius * 0.62, 0, Math.PI * 2);
    ctx.fill();
    for (const source of s.foods) {
      if (source.amount > 0) {
        const count = Math.min(45, source.amount);
        for (let i = 0; i < count; i++) {
          const angle = i * 2.39996,
            r = Math.sqrt(i / 45) * source.radius;
          ctx.fillStyle = i % 3 ? '#dfad55' : '#f3ca7a';
          ctx.beginPath();
          ctx.ellipse(
            source.x + Math.cos(angle) * r,
            source.y + Math.sin(angle) * r,
            3,
            2.1,
            angle,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
      this.label(
        `${this.options.foodLabel} · ${source.amount.toLocaleString(this.options.locale)}`,
        source.x,
        source.y + source.radius + 20,
        scale,
      );
    }
    for (const ant of s.ants) this.ant(ant, scale);
    this.label(this.options.nestLabel, nest.x, nest.y + nest.radius + 24, scale);
    if (selected) {
      ctx.strokeStyle = '#f2f3d9';
      ctx.lineWidth = 1.4 / scale;
      ctx.beginPath();
      ctx.arc(selected.x, selected.y, 12, 0, Math.PI * 2);
      ctx.stroke();
      if (this.options.sensors) {
        for (const probe of selected.sensors) {
          ctx.strokeStyle = probe.blocked ? '#ed8f72' : '#d4dcca';
          ctx.beginPath();
          ctx.moveTo(selected.x, selected.y);
          ctx.lineTo(
            selected.x + Math.cos(probe.angle) * s.config.brain.sensorDistance,
            selected.y + Math.sin(probe.angle) * s.config.brain.sensorDistance,
          );
          ctx.stroke();
        }
      }
      this.label(`#${selected.id + 1}`, selected.x, selected.y - 22, scale);
    }
    ctx.restore();
    ctx.strokeStyle = '#526050';
    ctx.lineWidth = 1 / scale;
    ctx.strokeRect(0, 0, world.width, world.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const units = this.camera.zoom > 2 ? 30 : 120;
    ctx.strokeStyle = '#a4b298';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, this.height - 22);
    ctx.lineTo(20 + units * scale, this.height - 22);
    ctx.stroke();
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillStyle = '#bccab1';
    ctx.textAlign = 'left';
    ctx.fillText(`${units} u`, 20, this.height - 7);
  }
  private label(text: string, x: number, y: number, scale: number) {
    const ctx = this.context;
    ctx.font = `${12 / scale}px ui-sans-serif, system-ui`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e1e7d3';
    ctx.fillText(text, x, y);
  }
  private ant(ant: Ant, scale: number) {
    const ctx = this.context;
    ctx.save();
    ctx.translate(ant.x, ant.y);
    ctx.rotate(ant.heading);
    ctx.strokeStyle = ant.carryingFood ? '#e2ba74' : '#a8c08e';
    ctx.fillStyle = ant.carryingFood ? '#e2ba74' : '#a8c08e';
    ctx.lineWidth = 0.65;
    if (scale > 0.55) {
      for (let i = -1; i <= 1; i++)
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(i * 1.6, side * 0.5);
          ctx.lineTo(i * 2.5 - 1, side * 3);
          ctx.lineTo(i * 3, side * 4);
          ctx.stroke();
        }
    }
    ctx.beginPath();
    ctx.ellipse(-2.7, 0, 2.3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0.3, 0, 1.5, 1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2.8, 0, 1.35, 0, Math.PI * 2);
    ctx.fill();
    if (ant.carryingFood) {
      ctx.fillStyle = '#ffcc71';
      ctx.beginPath();
      ctx.arc(5.5, 0, 1.9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
