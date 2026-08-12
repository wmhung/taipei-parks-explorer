import ParksExplorer from './components/ParksExplorer.jsx';

export default function App() {
  return (
    <div className='container'>
      <header className='site-head'>
        <p className='eyebrow'>Open data · Taipei City</p>
        <h1>
          Taipei <span className='mark'>Parks</span> Explorer
        </h1>
        <p className='lead'>
          Browse all 830 parks, green spaces and plazas. A React front end
          fetches from a Flask REST API — search, filtering and pagination are
          handled server-side.
        </p>
      </header>

      <ParksExplorer />

      <footer className='site-foot'>Built with React + Flask</footer>
    </div>
  );
}
