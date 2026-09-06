export class Camera {
  zoom = 1;
  x = 480;
  y = 300;
  fit(width: number, height: number) {
    this.zoom = 1;
    this.x = width / 2;
    this.y = height / 2;
  }
  scale(viewWidth: number, viewHeight: number, worldWidth: number, worldHeight: number) {
    return Math.min(viewWidth / worldWidth, viewHeight / worldHeight) * this.zoom;
  }
  zoomBy(factor: number) {
    this.zoom = Math.max(1, Math.min(5, this.zoom * factor));
  }
}
