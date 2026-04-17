import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authorsApi, authApi, uploadsApi, genresApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import './WriterDashboard.css';

function WriterDashboard() {
  const { logout, updateProfile } = useAuth();
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
  const [ktpUploading, setKtpUploading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    Promise.all([authorsApi.me(), genresApi.list(), authApi.me()])
      .then(([p, g, u]) => {
        setProfile(p);
        setGenreList(g);
        setForm({
          name: p.name || '',
          photo: p.photo || '',
          bio: p.bio || '',
          nationality: p.nationality || '',
          genres: p.genres || [],
          website: p.website || '',
          phone: u.phone || '',
          // Pencipta fields from authors row
          nik: p.nik || '',
          gender: p.gender || '',
          npwp: p.npwp || '',
          address: p.address || '',
          country: p.country || 'Indonesia',
          province: p.province || '',
          province_id: p.province_id || '',
          regency: p.regency || '',
          regency_id: p.regency_id || '',
          district: p.district || '',
          district_id: p.district_id || '',
          postal_code: p.postal_code || '',
          ktp_photo: p.ktp_photo || '',
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
        // Pencipta fields
        nik: form.nik || null,
        gender: form.gender || null,
        npwp: form.npwp || null,
        address: form.address || null,
        country: form.country || null,
        province: form.province || null,
        province_id: form.province_id || null,
        regency: form.regency || null,
        regency_id: form.regency_id || null,
        district: form.district || null,
        district_id: form.district_id || null,
        postal_code: form.postal_code || null,
        ktp_photo: form.ktp_photo || null,
      });
      // Save phone to user account if changed
      if (form.phone !== undefined) {
        await updateProfile({ phone: form.phone.trim() || null });
      }
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

  // ── Edit button — load province/regency/district dropdowns on first open ──

  async function startEditing() {
    setEditing(true);
    setError('');
    setSuccess('');
    if (provinces.length === 0) {
      try {
        const r = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        setProvinces(await r.json());
      } catch {}
    }
    if (form.province_id && regencies.length === 0) {
      try {
        const r = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${form.province_id}.json`);
        setRegencies(await r.json());
      } catch {}
    }
    if (form.regency_id && districts.length === 0) {
      try {
        const r = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${form.regency_id}.json`);
        setDistricts(await r.json());
      } catch {}
    }
  }

  async function handleProvChange(e) {
    const provId = e.target.value;
    const prov = provinces.find((p) => p.id === provId);
    setForm((f) => ({
      ...f, province_id: provId, province: prov?.name || '',
      regency: '', regency_id: '', district: '', district_id: '',
    }));
    setRegencies([]);
    setDistricts([]);
    if (provId) {
      try {
        const r = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`);
        setRegencies(await r.json());
      } catch {}
    }
  }

  async function handleRegChange(e) {
    const regId = e.target.value;
    const reg = regencies.find((r) => r.id === regId);
    setForm((f) => ({
      ...f, regency_id: regId, regency: reg?.name || '',
      district: '', district_id: '',
    }));
    setDistricts([]);
    if (regId) {
      try {
        const r = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regId}.json`);
        setDistricts(await r.json());
      } catch {}
    }
  }

  function handleDistChange(e) {
    const distId = e.target.value;
    const dist = districts.find((d) => d.id === distId);
    setForm((f) => ({ ...f, district_id: distId, district: dist?.name || '' }));
  }

  async function handleKtpFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setKtpUploading(true);
    setError('');
    try {
      const isImage = file.type === 'image/jpeg' || file.type === 'image/png';
      const tasks = [uploadsApi.uploadKtp(file)];
      if (isImage) tasks.push(uploadsApi.ocrKtp(file));
      const [uploaded, ocr] = await Promise.all(tasks);
      setForm((f) => ({ ...f, ktp_photo: uploaded.url }));
      if (ocr?.extracted && Object.keys(ocr.extracted).length > 0) {
        const { creator_name: _n, ...rest } = ocr.extracted;
        setForm((f) => ({ ...f, ...rest }));
        setSuccess('KTP berhasil dibaca. Periksa dan koreksi data yang terisi otomatis.');
      }
    } catch (err) {
      setError(err.message || 'Upload KTP gagal');
    } finally {
      setKtpUploading(false);
    }
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
                { label: 'Nomor HP', value: form.phone || '—' },
                { label: w.joined, value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID') : '—' },
              ].map(({ label, value }) => (
                <div className="writer-dash__detail-row" key={label}>
                  <span className="writer-dash__detail-label">{label}</span>
                  <span className="writer-dash__detail-value">{value}</span>
                </div>
              ))}

              {/* Pencipta summary */}
              {(profile?.nik || profile?.gender || profile?.address) && (
                <div className="writer-dash__pencipta-summary">
                  <span className="writer-dash__detail-label" style={{ display: 'block', marginBottom: '0.4rem' }}>Profil Pencipta</span>
                  {[
                    { label: 'NIK', value: profile?.nik },
                    { label: 'Jenis Kelamin', value: profile?.gender },
                    { label: 'NPWP', value: profile?.npwp },
                    { label: 'Alamat', value: profile?.address },
                    { label: 'Kecamatan', value: profile?.district },
                    { label: 'Kabupaten/Kota', value: profile?.regency },
                    { label: 'Provinsi', value: profile?.province },
                    { label: 'Kode Pos', value: profile?.postal_code },
                  ].filter(i => i.value).map(({ label, value }) => (
                    <div className="writer-dash__detail-row" key={label}>
                      <span className="writer-dash__detail-label">{label}</span>
                      <span className="writer-dash__detail-value">{value}</span>
                    </div>
                  ))}
                  {profile?.ktp_photo && (
                    <div className="writer-dash__detail-row">
                      <span className="writer-dash__detail-label">Foto KTP</span>
                      <span className="writer-dash__detail-value">
                        <a href={profile.ktp_photo} target="_blank" rel="noopener noreferrer" className="writer-dash__ktp-link">Lihat KTP</a>
                      </span>
                    </div>
                  )}
                </div>
              )}
              <button className="btn btn-primary btn-sm writer-dash__edit-btn" onClick={startEditing}>
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

              <div className="form-group">
                <label>Nomor HP</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="e.g. 08123456789"
                />
              </div>

              {/* ── Profil Pencipta ── */}
              <div className="writer-dash__pencipta-divider">
                <span>Profil Pencipta</span>
                <span className="creator-field-hint"> — untuk dokumen hak cipta &amp; penerbitan</span>
              </div>

              {/* KTP Upload + OCR */}
              <div className="form-group creator-ktp-group">
                <label>
                  Foto KTP <span className="creator-field-hint">(PNG / JPG / PDF, maks. 5 MB — data diisi otomatis via OCR)</span>
                </label>
                <div className="creator-ktp-row">
                  {form.ktp_photo && (
                    <a href={form.ktp_photo} target="_blank" rel="noopener noreferrer" className="creator-ktp-thumb">
                      <img src={form.ktp_photo} alt="KTP" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    </a>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,application/pdf"
                    onChange={handleKtpFileChange}
                    disabled={ktpUploading}
                  />
                </div>
                {ktpUploading && <span className="creator-ktp-status">Mengunggah &amp; membaca KTP…</span>}
              </div>

              <div className="creator-form-grid">
                <div className="form-group">
                  <label>NIK</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={form.nik}
                    onChange={(e) => setForm((f) => ({ ...f, nik: e.target.value }))}
                    placeholder="16 digit NIK"
                  />
                </div>

                <div className="form-group">
                  <label>Jenis Kelamin</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                  >
                    <option value="">— Pilih —</option>
                    <option value="LAKI-LAKI">Laki-laki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>NPWP</label>
                  <input
                    type="text"
                    value={form.npwp}
                    onChange={(e) => setForm((f) => ({ ...f, npwp: e.target.value }))}
                    placeholder="xx.xxx.xxx.x-xxx.xxx"
                  />
                </div>

                <div className="form-group creator-full-col">
                  <label>Alamat</label>
                  <textarea
                    rows={2}
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Negara</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Provinsi</label>
                  <select value={form.province_id} onChange={handleProvChange}>
                    <option value="">— Pilih Provinsi —</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Kabupaten / Kota</label>
                  <select value={form.regency_id} onChange={handleRegChange} disabled={!regencies.length}>
                    <option value="">— Pilih Kabupaten/Kota —</option>
                    {regencies.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Kecamatan</label>
                  <select value={form.district_id} onChange={handleDistChange} disabled={!districts.length}>
                    <option value="">— Pilih Kecamatan —</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Kode Pos</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={form.postal_code}
                    onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
                    placeholder="e.g. 40123"
                  />
                </div>
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
