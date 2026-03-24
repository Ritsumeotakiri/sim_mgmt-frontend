import { useState, useMemo } from 'react';
import { CreditCard, ShoppingCart, Users, TrendingUp, Package, CheckCircle2 } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { SIMTable } from './SIMTable';
import { SellSIMModal } from './SellSIMModal';
import { TransactionsTable } from './TransactionsTable';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
export function OperatorDashboard({ sims, msisdns, customers, plans, transactions, onSellSIM }) {
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [sellingSIM, setSellingSIM] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    // Stats
    const stats = useMemo(() => ({
        totalSIMs: sims.length,
        inactiveSIMs: sims.filter(s => s.status === 'inactive').length,
        availableMSISDNs: msisdns.filter(m => m.status === 'available').length,
        mySales: transactions.filter(t => t.userName === 'Operator').length,
    }), [sims, msisdns, transactions]);
    // Get available SIMs for selling
    const availableSIMs = useMemo(() => {
        return sims.filter(s => s.status === 'inactive');
    }, [sims]);
    // Get available MSISDNs
    const availableMSISDNs = useMemo(() => {
        return msisdns.filter(m => m.status === 'available');
    }, [msisdns]);
    const handleSellClick = (sim) => {
        if (sim.status !== 'inactive') {
            toast.error('Only inactive SIMs can be sold');
            return;
        }
        setSellingSIM(sim);
        setIsSellModalOpen(true);
    };
    const handleCompleteSale = (saleData) => {
        onSellSIM(saleData);
        setIsSellModalOpen(false);
        setSellingSIM(null);
    };
    return (<div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total SIMs" value={stats.totalSIMs} icon={CreditCard} accentColor="blue"/>
        <StatsCard title="Available for Sale" value={stats.inactiveSIMs} icon={Package} accentColor="green"/>
        <StatsCard title="MSISDNs in Stock" value={stats.availableMSISDNs} icon={CheckCircle2} accentColor="amber"/>
        <StatsCard title="My Sales" value={stats.mySales} icon={TrendingUp} accentColor="blue"/>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm p-5">
        <h3 className="font-semibold text-[#1f1f1f] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button onClick={() => setActiveTab('sims')} className="p-4 rounded-lg border border-[#f3f3f3] hover:border-[#3ebb7f] hover:bg-[#3ebb7f]/5 transition-all text-left">
            <div className="w-10 h-10 bg-[#3ebb7f]/10 rounded-lg flex items-center justify-center mb-3">
              <ShoppingCart className="w-5 h-5 text-[#3ebb7f]"/>
            </div>
            <p className="font-medium text-[#1f1f1f]">Sell SIM</p>
            <p className="text-sm text-[#828282]">{stats.inactiveSIMs} SIMs available</p>
          </button>

          <button onClick={() => setActiveTab('sims')} className="p-4 rounded-lg border border-[#f3f3f3] hover:border-[#5b93ff] hover:bg-[#5b93ff]/5 transition-all text-left">
            <div className="w-10 h-10 bg-[#5b93ff]/10 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-[#5b93ff]"/>
            </div>
            <p className="font-medium text-[#1f1f1f]">View Customers</p>
            <p className="text-sm text-[#828282]">{customers.length} registered</p>
          </button>

          <button onClick={() => setActiveTab('transactions')} className="p-4 rounded-lg border border-[#f3f3f3] hover:border-[#f6a94c] hover:bg-[#f6a94c]/5 transition-all text-left">
            <div className="w-10 h-10 bg-[#f6a94c]/10 rounded-lg flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-[#f6a94c]"/>
            </div>
            <p className="font-medium text-[#1f1f1f]">View Transactions</p>
            <p className="text-sm text-[#828282]">{transactions.length} total</p>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm">
        <div className="border-b border-[#f3f3f3]">
          <div className="flex">
            <button onClick={() => setActiveTab('overview')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
            ? 'border-[#1f1f1f] text-[#1f1f1f]'
            : 'border-transparent text-[#828282] hover:text-[#1f1f1f]'}`}>
              Overview
            </button>
            <button onClick={() => setActiveTab('sims')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sims'
            ? 'border-[#1f1f1f] text-[#1f1f1f]'
            : 'border-transparent text-[#828282] hover:text-[#1f1f1f]'}`}>
              SIM Cards
            </button>
            <button onClick={() => setActiveTab('transactions')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'transactions'
            ? 'border-[#1f1f1f] text-[#1f1f1f]'
            : 'border-transparent text-[#828282] hover:text-[#1f1f1f]'}`}>
              Transactions
            </button>
          </div>
        </div>

        <div className="p-5">
          {activeTab === 'overview' && (<div className="space-y-6">
              {/* SIMs Ready to Sell */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#1f1f1f]">SIMs Ready to Sell</h3>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('sims')}>
                    View All
                  </Button>
                </div>
                {availableSIMs.length === 0 ? (<div className="text-center py-8 text-[#828282] bg-[#f9f9f9] rounded-lg">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30"/>
                    <p>No SIMs available for sale</p>
                  </div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableSIMs.slice(0, 6).map((sim) => (<div key={sim.id} className="p-4 border border-[#f3f3f3] rounded-lg hover:border-[#3ebb7f] transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-sm text-[#1f1f1f]">{sim.iccid}</p>
                            <p className="text-xs text-[#828282]">Status: {sim.status}</p>
                          </div>
                          <Button size="sm" onClick={() => handleSellClick(sim)} className="bg-[#3ebb7f] hover:bg-[#3ebb7f]/90">
                            <ShoppingCart className="w-4 h-4 mr-1"/>
                            Sell
                          </Button>
                        </div>
                      </div>))}
                  </div>)}
              </div>

              {/* Recent Transactions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#1f1f1f]">Recent Transactions</h3>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('transactions')}>
                    View All
                  </Button>
                </div>
                <TransactionsTable transactions={transactions.slice(0, 5)}/>
              </div>
            </div>)}

          {activeTab === 'sims' && (<SIMTable sims={sims} userRole="operator" onEdit={() => { }} onDelete={() => { }} onAdd={() => { }} onSell={handleSellClick}/>)}

          {activeTab === 'transactions' && (<TransactionsTable transactions={transactions}/>)}
        </div>
      </div>

      {/* Sell SIM Modal */}
      <SellSIMModal isOpen={isSellModalOpen} onClose={() => {
            setIsSellModalOpen(false);
            setSellingSIM(null);
        }} onSell={handleCompleteSale} sim={sellingSIM} availableMSISDNs={availableMSISDNs} customers={customers} plans={plans}/>
    </div>);
}
