export class RfAni {
  constructor(image, frameWidth, frameHeight, frames = [], speed = 200, name = 'Unnamed', imageName = '') {
    this.image = image;
    this.imageName = imageName;
    this.name = name;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frames = frames;
    this.speed = speed;
    this.index = 0;
    this.timer = 0;
  }

  update(dt) {
    if (this.frames.length === 0) return;
    this.timer += dt;
    if (this.timer >= this.speed) {
      this.timer = 0;
      this.index = (this.index + 1) % this.frames.length;
    }
  }

  draw(ctx, x, y, scale = 1) {
    if (this.frames.length === 0) return;
    const frame = this.frames[this.index];
    const sx = frame[0] * this.frameWidth;
    const sy = frame[1] * this.frameHeight;
    const w = this.frameWidth * scale;
    const h = this.frameHeight * scale;
    ctx.drawImage(
      this.image,
      sx,
      sy,
      this.frameWidth,
      this.frameHeight,
      x - w / 2,
      y - h / 2,
      w,
      h
    );
  }

  setFrames(frames) {
    this.frames = frames;
    this.index = 0;
    this.timer = 0;
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  setName(name) {
    this.name = name;
  }
}
