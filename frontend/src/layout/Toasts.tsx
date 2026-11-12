import { ui, useUi } from '../core/ui';
import { Icon } from '../shared/Icon';

export function Toasts() {
  const toasts = useUi((s) => s.toasts);
  return (
    <div className="c-toasts" style={{ display: 'contents' }}>
      <div className="stack" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`} role="status">
            <span className="ic">
              <Icon name={t.kind === 'error' ? 'close' : t.kind === 'success' ? 'check' : 'bolt'} size={18} stroke={2.4} />
            </span>
            <div className="body">
              <strong>{t.title}</strong>
              {t.text && <p>{t.text}</p>}
            </div>
            <button type="button" onClick={() => ui.dismiss(t.id)} aria-label="Cerrar aviso"><Icon name="close" size={16} /></button>
            <span className="timer"></span>
          </div>
        ))}
      </div>
    </div>
  );
}
