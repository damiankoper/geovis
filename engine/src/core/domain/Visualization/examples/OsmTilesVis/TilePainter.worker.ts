class TilePainter {
  // eslint-disable-next-line
  ctx: Worker = self as any;
  constructor() {
    this.ctx.onmessage = this.onMessage.bind(this.ctx);
  }

  onMessage(event: MessageEvent) {
    console.log(event);
  }
}

new TilePainter();
