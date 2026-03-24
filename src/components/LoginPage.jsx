import { useState } from 'react';
import { CreditCard, Eye, EyeOff, Lock, Mail, User, Shield, Headphones, EyeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
const credentials = [
    {
        role: 'admin',
        email: 'admin@sim.com',
        password: 'admin123',
        name: 'Administrator',
        description: 'Full system access - manage SIMs, MSISDNs, users, and settings',
        icon: Shield,
        color: '#e9423a',
    },
    {
        role: 'manager',
        email: 'manager@sim.com',
        password: 'manager123',
        name: 'Manager',
        description: 'Manage SIMs, view transactions, oversee operations',
        icon: User,
        color: '#5b93ff',
    },
    {
        role: 'operator',
        email: 'operator@sim.com',
        password: 'operator123',
        name: 'Operator',
        description: 'Sell SIMs, create customers, view read-only data',
        icon: Headphones,
        color: '#3ebb7f',
    },
    {
        role: 'viewer',
        email: 'viewer@sim.com',
        password: 'viewer123',
        name: 'Viewer',
        description: 'Read-only access to view SIMs and transactions',
        icon: EyeIcon,
        color: '#828282',
    },
];
export function LoginPage({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [error, setError] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        // Find matching credential
        const matched = credentials.find((c) => c.email === email && c.password === password);
        if (matched) {
            onLogin(email, password, matched.role);
        }
        else {
            setError('Invalid email or password. Try using one of the credentials below.');
        }
    };
    const fillCredentials = (cred) => {
        setEmail(cred.email);
        setPassword(cred.password);
        setSelectedRole(cred.role);
        setError('');
    };
    return (<div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#1f1f1f] rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white"/>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1f1f1f]">SIM Manager</h1>
              <p className="text-sm text-[#828282]">Sign in to your account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#828282]"/>
                <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11 h-12" required/>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#828282]"/>
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 pr-11 h-12" required/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#828282] hover:text-[#1f1f1f] transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                </button>
              </div>
            </div>

            {error && (<div className="p-3 bg-[#e9423a]/10 text-[#e9423a] rounded-lg text-sm">
                {error}
              </div>)}

            <Button type="submit" className="w-full h-12 bg-[#1f1f1f] hover:bg-[#1f1f1f]/90 text-base">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#828282]">
              Don't have an account? Contact your administrator.
            </p>
          </div>
        </div>

        {/* Credentials Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-[#1f1f1f] mb-2">
              Demo Credentials
            </h2>
            <p className="text-sm text-[#828282] mb-6">
              Click on any role below to auto-fill credentials and test the system.
            </p>

            <div className="space-y-3">
              {credentials.map((cred) => {
            const Icon = cred.icon;
            const isSelected = selectedRole === cred.role;
            return (<button key={cred.role} onClick={() => fillCredentials(cred)} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${isSelected
                    ? 'border-[#1f1f1f] bg-[#f3f3f3]'
                    : 'border-[#f3f3f3] hover:border-[#c9c7c7] hover:bg-[#fafafa]'}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cred.color}15` }}>
                        <Icon className="w-5 h-5" style={{ color: cred.color }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-[#1f1f1f] capitalize">
                            {cred.name}
                          </h3>
                          <span className="text-xs px-2 py-1 rounded-full font-medium capitalize" style={{
                    backgroundColor: `${cred.color}15`,
                    color: cred.color,
                }}>
                            {cred.role}
                          </span>
                        </div>
                        <p className="text-sm text-[#828282] mt-1">
                          {cred.description}
                        </p>
                        <div className="mt-3 pt-3 border-t border-[#f3f3f3]">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-[#828282]">Email:</span>
                              <span className="ml-2 font-mono text-[#1f1f1f]">
                                {cred.email}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#828282]">Password:</span>
                              <span className="ml-2 font-mono text-[#1f1f1f]">
                                {cred.password}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>);
        })}
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-[#1f1f1f] rounded-2xl shadow-lg p-6 text-white">
            <h3 className="font-semibold mb-2">About SIM Manager</h3>
            <p className="text-sm text-white/70">
              A comprehensive system for managing SIM card lifecycle, MSISDN inventory, 
              customer onboarding, and sales transactions. Each role has specific 
              permissions tailored to their responsibilities.
            </p>
          </div>
        </div>
      </div>
    </div>);
}
