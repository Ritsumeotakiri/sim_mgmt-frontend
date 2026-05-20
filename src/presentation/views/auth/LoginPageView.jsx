import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import './AuthForm.css';

import heroPhoto from '../../../../asset/stock.png';


export function LoginPageView({ onLogin }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await onLogin(identifier, password);
    if (!success) {
      setError('Invalid username/email or password.');
    }
  };

  return (
    <div className="pmg-auth-scope pmg-auth-background">
      <div className="pmg-auth-layout">
        <aside
          className="pmg-auth-hero"
          aria-hidden="true"
          style={{ backgroundImage: `url(${heroPhoto})` }}
        >
        </aside>

        <main className="pmg-auth-panel">
          <div className="pmg-form-box">
            <div className="pmg-form-header">
              <div className="pmg-form-app">SIM Card Operational System</div>
              <h1>Sign in</h1>
            </div>

            <form onSubmit={handleSubmit} className="pmg-form">
              <div className="pmg-field">
                <Label htmlFor="identifier" className="pmg-field-label">Username or Email</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder=""
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pmg-line-input"
                  required
                />
              </div>

              <div className="pmg-field">
                <div className="pmg-field-row">
                  <Label htmlFor="password" className="pmg-field-label">Password</Label>
                  <button type="button" className="pmg-link" onClick={(e) => e.preventDefault()}>
                    Forgot password?
                  </button>
                </div>

                <div className="pmg-password">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder=""
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pmg-line-input pmg-line-input--with-icon"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="pmg-icon-btn"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                  </button>
                </div>
              </div>

              {error && <p className="pmg-error">{error}</p>}

              <Button type="submit" className="btn pmg-pill">
                Sign in
              </Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
