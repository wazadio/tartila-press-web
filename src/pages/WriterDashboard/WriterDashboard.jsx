import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authorsApi, uploadsApi, genresApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import './WriterDashboard.css';

function WriterDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const w = t.writerDashboard;
  const [profile, setProfile] = useState(null);
  const [genreList, setGenreList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([authorsApi.me(), genresApi.list()])
      .then(([p, g]) => {
        setProfile(p);
        setGenreList(g);
        setForm({
          name: p.name || '',
          photo: p.photo || '',
          bio: p.bio || '',
          nationality: p.nationality || '',
          genres: p.genres || [],
          website: p.website || '',
        });
      })
      .catch(() => setError(w.loadFailed))
      .finally(() => setLoading(false));
  }, []);

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const result = await uploadsApi.uploadImage(file);
      setForm((prev) => ({ ...prev, photo: result.url }));
    } catch (err) {
      setError(err.message || w.photoUploadFailed);
    } finally {
      setPhotoUploading(false);
    }
  }

  function handleGenreSelect(e) {
    const val = e.target.value;
    if (!val || form.genres.includes(val)) return;
    setForm((prev) => ({ ...prev, genres: [...prev.genres, val] }));
    e.target.value = '';
  }

  function handleGenreRemove(name) {
    setForm((prev) => ({ ...prev, genres: prev.genres.filter((g) => g !== name) }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError(w.nameRequired); return; }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await authorsApi.updateMe({
        name: form.name,
        photo: form.photo || null,
        bio: form.bio || null,
        nationality: form.nationality || null,
        genres: form.genres.filter(Boolean),
        website: form.website || null,
      });
      setProfile(updated);
      setEditing(false);
      setSuccess(w.saved);
    } catch (err) {
      setError(err.message || w.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/writer/login');
  }

  if (loading) return <div className="writer-dash__loading">{w.loading}</div>;

  return (
    <div className="writer-dash">
      <div className="container">
        <div className="writer-dash__header">
          <div>
            <p className="writer-dash__eyebrow">{w.eyebrow}</p>
            <h1>{w.title}</h1>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>{w.logout}</button>
        </div>

        {error && <p className="error-msg writer-dash__msg">{error}</p>}
        {success && <p className="writer-dash__success">{success}</p>}

        <div className="writer-dash__card">
          <div className="writer-dash__profile-row">
            <div className="writer-dash__avatar">
              {(editing ? form.photo : profile?.photo)
                ? <img src={editing ? form.photo : profile.photo} alt={profile?.name} />
                : <span>{profile?.name?.[0]?.toUpperCase()}</span>}
            </div>
            <div className="writer-dash__info">
              <h2>{profile?.name}</h2>
              <p className="writer-dash__email">{profile?.email}</p>
            </div>
          </div>

          {!editing ? (
            <div className="writer-dash__details">
              {[
                { label: w.bio, value: profile?.bio || '—' },
                { label: w.nationality, value: profile?.nationality || '—' },
                { label: w.genres, value: profile?.genres?.length ? profile.genres.join(', ') : '—' },
                { label: w.website, value: profile?.website || '—' },
                { label: w.joined, value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID') : '—' },
              ].map(({ label, value }) => (
                <div className="writer-dash__detail-row" key={label}>
                  <span className="writer-dash__detail-label">{label}</span>
                  <span className="writer-dash__detail-value">{value}</span>
                </div>
              ))}
              <button className="btn btn-primary btn-sm writer-dash__edit-btn" onClick={() => { setEditing(true); setError(''); setSuccess(''); }}>
                {w.editProfile}
              </button>
            </div>
          ) : (
            <form className="writer-dash__edit-form" onSubmit={handleSave}>
              <div className="writer-photo-row">
                <div className="writer-dash__avatar writer-dash__avatar--sm">
                  {form.photo
                    ? <img src={form.photo} alt="Preview" />
                    : <span>{profile?.name?.[0]?.toUpperCase()}</span>}
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>{w.changePhoto}</label>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={photoUploading} />
                  {photoUploading && <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{w.uploading}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>{w.name} *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>

              <div className="form-group">
                <label>{w.bio}</label>
                <textarea rows={3} value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} placeholder={w.bioPlaceholder} />
              </div>

              <div className="form-group">
                <label>{w.nationality}</label>
                <input type="text" value={form.nationality} onChange={(e) => setForm((p) => ({ ...p, nationality: e.target.value }))} placeholder={w.nationalityPlaceholder} />
              </div>

              <div className="form-group">
                <label>{w.genres}</label>
                <div className="writer-dash__genre-tags">
                  {form.genres.map((g) => {
                    const match = genreList.find((gl) => gl.name === g);
                    const label = match && lang === 'id' && match.name_id ? match.name_id : g;
                    return (
                      <span key={g} className="writer-dash__genre-tag">
                        {label}
                        <button type="button" onClick={() => handleGenreRemove(g)}>×</button>
                      </span>
                    );
                  })}
                </div>
                <select onChange={handleGenreSelect} defaultValue="">
                  <option value="" disabled>{w.genrePlaceholder}</option>
                  {genreList
                    .filter((g) => !form.genres.includes(g.name))
                    .map((g) => (
                      <option key={g.id} value={g.name}>
                        {lang === 'id' && g.name_id ? g.name_id : g.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>{w.website}</label>
                <input type="url" value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://..." />
              </div>

              <div className="writer-dash__form-actions">
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving || photoUploading}>
                  {saving ? w.saving : w.save}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setEditing(false); setError(''); }}>
                  {w.cancel}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default WriterDashboard;
