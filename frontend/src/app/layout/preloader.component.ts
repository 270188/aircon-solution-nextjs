import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';

/** Pantalla de carga inicial con el copo/sol del logo girando. */
@Component({
  selector: 'app-preloader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!gone()) {
      <div class="preloader" [class.leaving]="leaving()" role="status" aria-label="Cargando">
        <div class="emblem">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="44" class="ring" />
            <g class="flake">
              @for (a of angles; track a) {
                <g [attr.transform]="'rotate(' + a + ' 50 50)'">
                  <path d="M50 50V18M50 28l-7-7M50 28l7-7" />
                </g>
              }
            </g>
          </svg>
        </div>
        <p class="word"><span class="air">AIRCON</span><span class="con">SOLUTION</span> SERVICES SAC</p>
        <div class="bar"><span></span></div>
      </div>
    }
  `,
  styles: `
    .preloader {
      position: fixed; inset: 0; z-index: 2000; display: grid; place-content: center; justify-items: center; gap: 18px;
      background: radial-gradient(circle at 50% 40%, #13294a, #050d1a 70%);
      transition: clip-path .9s cubic-bezier(.76,0,.24,1);
      clip-path: inset(0 0 0 0);
    }
    .preloader.leaving { clip-path: inset(0 0 100% 0); }
    .emblem { width: 96px; height: 96px; }
    svg { width: 100%; height: 100%; fill: none; stroke-linecap: round; }
    .ring { stroke: rgba(94,198,255,.25); stroke-width: 3; stroke-dasharray: 276; stroke-dashoffset: 276;
      animation: draw 1.2s cubic-bezier(.16,1,.3,1) forwards; }
    .flake { stroke: #5ec6ff; stroke-width: 4; transform-origin: 50px 50px; animation: spin 2.4s cubic-bezier(.65,0,.35,1) infinite; }
    .word { font-family: var(--font-display); font-weight: 800; letter-spacing: .2em; color: #fff; font-size: .9rem;
      animation: fadeUp .8s .2s both; }
    .air { color: #fff; } .con { color: #f5821f; }
    .bar { width: 160px; height: 3px; border-radius: 3px; background: rgba(255,255,255,.12); overflow: hidden; }
    .bar span { display: block; height: 100%; width: 40%; border-radius: 3px; background: linear-gradient(90deg,#5ec6ff,#f5821f);
      animation: load 1.1s ease-in-out infinite; }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes load { 0% { transform: translateX(-100%); } 100% { transform: translateX(260%); } }
  `,
})
export class PreloaderComponent implements OnInit {
  protected readonly angles = [0, 60, 120, 180, 240, 300];
  protected readonly leaving = signal(false);
  protected readonly gone = signal(false);

  ngOnInit(): void {
    const finish = () => {
      setTimeout(() => this.leaving.set(true), 350);
      setTimeout(() => this.gone.set(true), 1300);
    };
    if (document.readyState === 'complete') finish();
    else addEventListener('load', finish, { once: true });
    // Nunca bloquear más de 3 s aunque alguna imagen tarde.
    setTimeout(() => this.leaving.set(true), 3000);
    setTimeout(() => this.gone.set(true), 4000);
  }
}
