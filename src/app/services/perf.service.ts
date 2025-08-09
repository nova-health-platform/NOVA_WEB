// src/app/services/perf.service.ts
import { Injectable } from '@angular/core';

export type PerfTier = 'high' | 'mid' | 'low';
export interface PerfDiag {
  tier: PerfTier;
  fps: number;
  throughput: number; // clears/ms approximatifs
  mem: number;
  cores: number;
  dpi: number;
  webgl: boolean;
  reducedMotion: boolean;
  score: number;
  throttled: boolean;
}

@Injectable({ providedIn: 'root' })
export class PerfService {
  private KEY = 'perfTier:v4';             // bump de version pour purger l’ancien cache
  private TTL = 24 * 60 * 60 * 1000;       // 24h

  getCached(): PerfTier | null {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return null;
      const { tier, ts } = JSON.parse(raw);
      if (Date.now() - ts > this.TTL) return null;
      return tier as PerfTier;
    } catch { return null; }
  }

  cache(tier: PerfTier) {
    try { localStorage.setItem(this.KEY, JSON.stringify({ tier, ts: Date.now() })); } catch {}
  }

  async detectTier(opts: { ignoreReducedMotion?: boolean } = {}): Promise<PerfTier> {
    const diag = await this.diagnostics(opts);
    this.cache(diag.tier);
    return diag.tier;
  }

  async diagnostics(opts: { ignoreReducedMotion?: boolean } = {}): Promise<PerfDiag> {
    await this.waitUntilVisible(1500); // attend focus/visible (max 1.5s)

    const reducedMotion = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: false });
    const webgl = !!gl;
    if (!webgl) {
      return {
        tier: 'low', fps: 0, throughput: 0,
        mem: this.mem(), cores: this.cores(), dpi: this.dpi(),
        webgl, reducedMotion, score: 0, throttled: false
      };
    }

    // 1) FPS (raf)
    const fps = await this.measureFps(gl as WebGLRenderingContext, 300);

    // 2) Throughput GPU (indépendant de rAF)
    const throughput = this.measureThroughput(gl as WebGLRenderingContext, 120); // clears/ms

    // Détecte un rAF probablement bridé
    const throttled = fps < 15 && throughput > 0.5;

    const mem = this.mem();
    const cores = this.cores();
    const dpi = this.dpi();

    // Score (si rAF bridé, on remplace la composante FPS par une note selon throughput)
    let score = 0;

    if (throttled) {
      // approx: 0.5 clears/ms ~ moyen, 1+ ~ bon
      if (throughput >= 1.0) score += 2;
      else if (throughput >= 0.5) score += 1;
    } else {
      if (fps >= 55) score += 2;
      else if (fps >= 40) score += 1;
    }

    if (mem >= 8) score += 2;
    else if (mem >= 4) score += 1;

    if (cores >= 8) score += 2;
    else if (cores >= 4) score += 1;

    if (dpi <= 1.5) score += 1;

    if (reducedMotion && !opts.ignoreReducedMotion) score -= 2;

    // Garde-fou final :
    // - si FPS < 25 ET throughput < 0.4 ⇒ low forcé
    // - sinon tier par score
    let tier: PerfTier;
    if (!throttled && fps < 25 && throughput < 0.4) {
      tier = 'low';
    } else {
      tier = score >= 6 ? 'high' : score >= 4 ? 'mid' : 'low';
    }

    return { tier, fps, throughput, mem, cores, dpi, webgl, reducedMotion, score, throttled };
  }

  // ---------- helpers ----------

  private mem(): number { return (navigator as any).deviceMemory ?? 4; }
  private cores(): number { return navigator.hardwareConcurrency || 4; }
  private dpi(): number { return Math.min(window.devicePixelRatio || 1, 2.5); }

  private async waitUntilVisible(timeoutMs: number): Promise<void> {
    if (!document.hidden && document.hasFocus()) return;
    await new Promise<void>((resolve) => {
      const done = () => { cleanup(); resolve(); };
      const cleanup = () => {
        document.removeEventListener('visibilitychange', onVis);
        window.removeEventListener('focus', onFocus);
        clearTimeout(to);
      };
      const onVis = () => { if (!document.hidden) done(); };
      const onFocus = () => done();
      const to = setTimeout(done, timeoutMs);
      document.addEventListener('visibilitychange', onVis);
      window.addEventListener('focus', onFocus);
    });
  }

  private measureFps(gl: WebGLRenderingContext, ms: number): Promise<number> {
    const vs = `attribute vec2 a; void main(){ gl_Position = vec4(a,0.0,1.0); }`;
    const fs = `precision mediump float; void main(){ gl_FragColor = vec4(1.0); }`;
    const prog = gl.createProgram()!;
    const vsh = gl.createShader(gl.VERTEX_SHADER)!; gl.shaderSource(vsh, vs); gl.compileShader(vsh);
    const fsh = gl.createShader(gl.FRAGMENT_SHADER)!; gl.shaderSource(fsh, fs); gl.compileShader(fsh);
    gl.attachShader(prog, vsh); gl.attachShader(prog, fsh); gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ -1,-1, 3,-1, -1,3 ]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const DRAWS_PER_FRAME = 3;
    let frames = 0; const start = performance.now();

    return new Promise((resolve) => {
      const step = () => {
        gl.viewport(0, 0, gl.drawingBufferWidth || 640, gl.drawingBufferHeight || 360);
        gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);
        for (let i=0;i<DRAWS_PER_FRAME;i++) gl.drawArrays(gl.TRIANGLES, 0, 3);
        frames++;
        if (performance.now() - start < ms) requestAnimationFrame(step);
        else resolve(frames / (ms/1000));
      };
      requestAnimationFrame(step);
    });
  }

  // boucle synchrone courte qui force le GPU à finir les commandes
  private measureThroughput(gl: WebGLRenderingContext, windowMs: number): number {
    const start = performance.now();
    let clears = 0;
    while (performance.now() - start < windowMs) {
      gl.clearColor(0,0,0,1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.finish(); // force l’attente GPU -> donne une idée du débit
      clears++;
    }
    // clears/ms
    return clears / windowMs;
  }
}
