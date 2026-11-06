export class InputMonitor {
  private active = new Set<string>();
  peak = 0;
  cancellations = 0;

  down(id: string) {
    this.active.add(id);
    this.peak = Math.max(this.peak, this.active.size);
  }

  up(id: string, cancelled = false) {
    if (cancelled) this.cancellations++;
    this.active.delete(id);
  }

  clear() {
    this.active.clear();
  }

  reset() {
    this.clear();
    this.peak = 0;
    this.cancellations = 0;
  }

  get count() {
    return this.active.size;
  }
}
