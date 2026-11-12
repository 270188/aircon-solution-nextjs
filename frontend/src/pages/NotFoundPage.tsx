import { Link } from 'react-router';

import { Icon } from '../shared/Icon';

export function NotFoundPage() {
  return (
    <div className="c-not-found-page" style={{ display: 'contents' }}>
      <div className="wrap">
        <div className="big" aria-hidden="true">
          <span>4</span>
          <span className="flake"><Icon name="snow" size={120} stroke={1.4} /></span>
          <span>4</span>
        </div>
        <h1>Esta página se congeló</h1>
        <p>No encontramos lo que buscabas. Volvamos a un lugar más cálido.</p>
        <Link to="/" className="btn btn-primary"><Icon name="home" size={18} /> Ir al inicio</Link>
      </div>
    </div>
  );
}
