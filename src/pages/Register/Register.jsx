import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import '../Login/Login.css';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useLang();
  const r = t.register;
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = r.nameRequired;
    if (!form.email.trim()) errs.email = r.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = r.emailInvalid;
    if (!form.password) errs.password = r.passwordRequired;
    else if (form.password.length < 8) errs.password = r.passwordTooShort;
    if (form.confirmPassword !== form.password) errs.confirmPassword = r.passwordMismatch;
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
      await register(form.name, form.email, form.password);
      navigate('/check-email', { state: { email: form.email } });
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <p className="auth-card__eyebrow">Tartila</p>
          <h1>{r.title}</h1>
          <p>{r.subtitle}</p>
        </div>
        {apiError && <p className="error-msg auth-api-error">{apiError}</p>}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name">{r.fullName}</label>
            <input id="name" name="name" type="text" autoComplete="name"
              value={form.name} onChange={handleChange}
              className={errors.name ? 'input-error' : ''} />
            {errors.name && <span className="error-msg">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="email">{r.email}</label>
            <input id="email" name="email" type="email" autoComplete="email"
              value={form.email} onChange={handleChange}
              className={errors.email ? 'input-error' : ''} />
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">{r.password}</label>
            <input id="password" name="password" type="password" autoComplete="new-password"
              value={form.password} onChange={handleChange}
              className={errors.password ? 'input-error' : ''} />
            {errors.password && <span className="error-msg">{errors.password}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">{r.confirmPassword}</label>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password"
              value={form.confirmPassword} onChange={handleChange}
              className={errors.confirmPassword ? 'input-error' : ''} />
            {errors.confirmPassword && <span className="error-msg">{errors.confirmPassword}</span>}
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? r.creating : r.submit}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/login">{r.hasAccount}</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
