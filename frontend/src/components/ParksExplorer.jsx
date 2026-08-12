import { useEffect, useRef, useState } from 'react';
import ParkModal from './ParkModal.jsx';

const PER_PAGE = 12;

export default function ParksExplorer() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [area, setArea] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ types: [], areas: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const debounce = useRef(null);

  // Load filter options once.
  useEffect(() => {
    fetch('/api/filters')
      .then((r) => r.json())
      .then(setFilters)
      .catch(() => {});
  }, []);

  // Fetch parks whenever a query input changes (search is debounced).
  useEffect(() => {
    setLoading(true);
    setError('');
    clearTimeout(debounce.current);

    debounce.current = setTimeout(
      () => {
        const params = new URLSearchParams({
          search,
          type,
          area,
          page: String(page),
          per_page: String(PER_PAGE),
        });
        fetch(`/api/parks?${params.toString()}`)
          .then((r) => {
            if (!r.ok) throw new Error('Request failed');
            return r.json();
          })
          .then((d) => setData(d))
          .catch(() =>
            setError('Could not reach the API. Is the Flask server running?'),
          )
          .finally(() => setLoading(false));
      },
      search ? 300 : 0,
    );

    return () => clearTimeout(debounce.current);
  }, [search, type, area, page]);

  // Reset to page 1 when filters/search change.
  const onSearch = (v) => {
    setSearch(v);
    setPage(1);
  };
  const onType = (v) => {
    setType(v);
    setPage(1);
  };
  const onArea = (v) => {
    setArea(v);
    setPage(1);
  };

  return (
    <div className='explorer'>
      <div className='explorer-controls'>
        <div className='search-box'>
          <input
            type='text'
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder='Search parks by name, area or description…'
            aria-label='Search parks'
          />
        </div>
        <select
          value={type}
          onChange={(e) => onType(e.target.value)}
          aria-label='Filter by type'
        >
          <option value=''>All types</option>
          {filters.types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={area}
          onChange={(e) => onArea(e.target.value)}
          aria-label='Filter by area'
        >
          <option value=''>All areas</option>
          {filters.areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <p className='explorer-meta'>
        {loading
          ? 'Loading…'
          : `${data.total} result${data.total === 1 ? '' : 's'}`}
      </p>

      {error ? (
        <div className='state-msg'>{error}</div>
      ) : data.items.length === 0 && !loading ? (
        <div className='state-msg'>
          No parks match your search. Try clearing a filter.
        </div>
      ) : (
        <div className='parks-grid'>
          {data.items.map((p) => (
            <button
              className='park-card'
              key={p.id}
              onClick={() => setSelectedId(p.id)}
            >
              <span className='badge'>{p.type || 'Park'}</span>
              <h4>{p.name}</h4>
              {p.nameEng && <span className='eng'>{p.nameEng}</span>}
              <span className='area'>{p.area}</span>
            </button>
          ))}
        </div>
      )}

      {data.totalPages > 1 && (
        <div className='pagination'>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            ← Prev
          </button>
          <span className='page-info'>
            Page {data.page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
          >
            Next →
          </button>
        </div>
      )}

      {selectedId && (
        <ParkModal id={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
