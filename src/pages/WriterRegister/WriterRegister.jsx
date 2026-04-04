import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { writersApi } from '../../services/api';
import { useLang } from '../../context/LanguageContext';
import '../Login/Login.css';

function WriterRegister() {
  const navigate = useNavigate();
  const { t } = useLang();
  const w = t.writerRegister;
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = w.nameRequired;
    if (!form.email.trim()) errs.email = w.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = w.emailInvalid;
    if (!form.password) errs.password = w.passwordRequired;
    else if (form.password.length < 8) errs.password = w.passwordTooShort;
    if (form.confirmPassword !== form.password) errs.confirmPassword = w.passwordMismatch;
    return errs;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');
    try {
      await writersApi.register({ name: form.name, email: form.email, password: form.password });
      navigate('/check-email', { state: { email: form.email } });
    } catch (err) {
      setApiError(err.message || w.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <p className="auth-card__eyebrow">{w.eyebrow}</p>
          <h1>{w.title}</h1>
          <p>{w.subtitle}</p>
        </div>
        {apiError && <p className="error-msg auth-api-error">{apiError}</p>}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name">{w.fullName}</label>
            <input id="name" name="name" type="text" autoComplete="name"
              value={form.name} onChange={handleChange}
              className={errors.name ? 'input-error' : ''} />
            {errors.name && <span className="error-msg">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="email">{w.email}</label>
            <input id="email" name="email" type="email" autoComplete="email"
              value={form.email} onChange={handleChange}
              className={errors.email ? 'input-error' : ''} />
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">{w.password}</label>
            <input id="password" name="password" type="password" autoComplete="new-password"
              value={form.password} onChange={handleChange}
              className={errors.password ? 'input-error' : ''} />
            {errors.password && <span className="error-msg">{errors.password}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">{w.confirmPassword}</label>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password"
              value={form.confirmPassword} onChange={handleChange}
              className={errors.confirmPassword ? 'input-error' : ''} />
            {errors.confirmPassword && <span className="error-msg">{errors.confirmPassword}</span>}
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? w.creating : w.submit}
          </button>
        </form>
        <div className="auth-footer">
          <p><Link to="/writer/login">{w.hasAccount}</Link></p>
          <p><Link to="/register">{w.readerRegister}</Link></p>
        </div>
      </div>
    </div>
  );
}

export default WriterRegister;
