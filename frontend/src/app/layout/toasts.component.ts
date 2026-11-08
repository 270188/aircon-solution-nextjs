import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { UiService } from '../core/ui.service';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-toasts',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack" aria-live="polite" aria-atomic="false">
      @for (t of ui.toasts(); track t.id) {
        <div [class]="'toast ' + t.kind" role="status">
          <span class="ic"><app-icon [name]="t.kind === 'error' ? 'close' : t.kind === 'success' ? 'check' : 'bolt'" [size]="18" [stroke]="2.4" /></span>
          <div class="body">
            <strong>{{ t.title }}</strong>
            @if (t.text) { <p>{{ t.text }}</p> }
          </div>
          <button type="button" (click)="ui.dismiss(t.id)" aria-label="Cerrar aviso"><app-icon name="close" [size]="16" /></button>
          <span class="timer"></span>
        </div>
      }
    </div>
  `,
  styles: `
    .stack { position: fixed; top: calc(var(--header-h) + 12px); right: 16px; left: 16px; z-index: 1500; display: grid; gap: 10px;
      justify-items: end; pointer-events: none; }
    .toast { pointer-events: auto; position: relative; overflow: hidden; width: min(380px, 100%); display: flex; gap: 12px; align-items: flex-start;
      padding: 14px 14px 16px; border-radius: 16px; background: var(--bg-elevated); border: 1px solid var(--border); box-shadow: var(--shadow-lg);
      animation: toastIn .55s var(--ease-spring) both; }
    .ic { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; color: #fff; flex-shrink: 0; }
    .success .ic { background: #22c55e; } .error .ic { background: var(--red-500); } .info .ic { background: var(--blue-500); }
    .body { flex: 1; } strong { display: block; font-size: .95rem; } p { color: var(--text-muted); font-size: .88rem; margin-top: 2px; }
    button { color: var(--text-muted); padding: 4px; border-radius: 8px; } button:hover { color: var(--text); }
    .timer { position: absolute; left: 0; bottom: 0; height: 3px; width: 100%; transform-origin: left; animation: timer 5s linear forwards; }
    .success .timer { background: #22c55e; } .error .timer { background: var(--red-500); animation-duration: 7s; } .info .timer { background: var(--blue-500); }
    @keyframes toastIn { from { opacity: 0; transform: translateX(60px) scale(.9); } }
    @keyframes timer { to { transform: scaleX(0); } }
  `,
})
export class ToastsComponent {
  protected readonly ui = inject(UiService);
}
