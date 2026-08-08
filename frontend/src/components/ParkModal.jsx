import { useEffect, useState } from "react";

function Fact({ label, value }) {
  if (!value) return null;
  return (
    <div className="fact">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

export default function ParkModal({ id, onClose }) {
  const [park, setPark] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/parks/${id}`)
      .then((r) => r.json())
      .then(setPark)
      .finally(() => setLoading(false));
  }, [id]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const hours =
    park && park.openStart && park.openEnd
      ? park.openStart === "00:00" && park.openEnd === "24:00"
        ? "Open 24 hours"
        : `${park.openStart} – ${park.openEnd}`
      : "";

  const areaSize =
    park && park.landArea && !isNaN(Number(park.landArea))
      ? `${Number(park.landArea).toLocaleString()} m²`
      : "";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {loading || !park ? (
          <div className="state-msg" style={{ padding: "60px" }}>
            Loading…
          </div>
        ) : (
          <>
            <div className="modal-head">
              <span className="badge">{park.type || "Park"}</span>
              <h3>{park.name}</h3>
              {park.nameEng && <div className="eng">{park.nameEng}</div>}
            </div>
            <div className="modal-body">
              {park.overview && (
                <p className="overview">{park.overview.trim()}</p>
              )}
              <div className="facts">
                <Fact label="Managed by" value={park.area} />
                <Fact label="Location" value={park.location} />
                <Fact label="Opening hours" value={hours} />
                <Fact label="Land area" value={areaSize} />
                <Fact label="Built" value={park.constYear} />
                <Fact label="Phone" value={park.phone} />
                <Fact label="Sports" value={park.sports} />
                <Fact label="Recreation" value={park.recreation} />
                <Fact label="Facilities" value={park.service} />
                <Fact label="Getting there" value={park.transit} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
