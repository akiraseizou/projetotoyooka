import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PackagePlus, 
  PackageMinus, 
  Users, 
  FileText, 
  Menu, 
  ScanLine, 
  Save, 
  FileSpreadsheet,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  BrainCircuit,
  X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { UnitOfMeasure, Client, Product, Transaction, ViewState } from './types';
import { StorageService } from './storage';
import { BarcodeScanner } from './BarcodeScanner';
import { generateReportAnalysis } from './geminiService';

// --- Helper Components ---

const InputField = ({ label, value, onChange, type = "text", readOnly = false, required = true, placeholder = "" }: any) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      required={required}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent ${readOnly ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
    />
  </div>
);

const SelectField = ({ label, value, onChange, options }: any) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// --- Main App ---

export default function App() {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanCallback, setScanCallback] = useState<(code: string) => void>(() => {});

  // Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form States
  const [clientForm, setClientForm] = useState<Partial<Client>>({});
  const [productForm, setProductForm] = useState<Partial<Product>>({ unit: UnitOfMeasure.UN, type: 'MATERIAL' });
  const [transactionForm, setTransactionForm] = useState<Partial<Transaction>>({ quantity: 1 });

  // Load Data
  useEffect(() => {
    setClients(StorageService.getClients());
    setProducts(StorageService.getProducts());
    setTransactions(StorageService.getTransactions());
  }, []);

  const handleScan = (code: string) => {
    scanCallback(code);
    setShowScanner(false);
  };

  const triggerScan = (callback: (code: string) => void) => {
    setScanCallback(() => callback);
    setShowScanner(true);
  };

  // --- Handlers ---

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.code) return;
    const newClient: Client = {
      id: crypto.randomUUID(),
      code: clientForm.code,
      name: clientForm.name
    };
    StorageService.saveClient(newClient);
    setClients(StorageService.getClients());
    setClientForm({});
    alert("Cliente salvo!");
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.code || !productForm.value) return;
    const newProduct: Product = {
      id: crypto.randomUUID(),
      code: productForm.code,
      barcode: productForm.barcode || '',
      name: productForm.name,
      value: Number(productForm.value),
      unit: productForm.unit as UnitOfMeasure,
      clientName: productForm.clientName || 'N/A',
      type: productForm.type as 'MATERIAL' | 'FINISHED_GOOD'
    };
    StorageService.saveProduct(newProduct);
    setProducts(StorageService.getProducts());
    setProductForm({ unit: UnitOfMeasure.UN, type: view === 'REGISTER_MATERIAL' ? 'MATERIAL' : 'FINISHED_GOOD' });
    alert("Produto salvo!");
  };

  const handleTransaction = (e: React.FormEvent, type: 'ENTRY' | 'EXIT') => {
    e.preventDefault();
    if (!transactionForm.productCode || !transactionForm.quantity) return;

    const selectedProduct = products.find(p => p.code === transactionForm.productCode);
    if (!selectedProduct) {
      alert("Produto não encontrado!");
      return;
    }

    const total = selectedProduct.value * (transactionForm.quantity || 0);

    const newTrans: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      monthKey: new Date().toISOString().slice(0, 7),
      productCode: selectedProduct.code,
      barcode: selectedProduct.barcode,
      productName: selectedProduct.name,
      unitValue: selectedProduct.value,
      unit: selectedProduct.unit,
      quantity: Number(transactionForm.quantity),
      totalValue: total,
      clientName: transactionForm.clientName || selectedProduct.clientName,
      type: type
    };

    StorageService.saveTransaction(newTrans);
    setTransactions(StorageService.getTransactions());
    setTransactionForm({ quantity: 1 });
    alert("Registro salvo com sucesso!");
  };

  const findProductByBarcode = (code: string) => {
    const p = products.find(prod => prod.barcode === code);
    if (p) {
      setTransactionForm(prev => ({
        ...prev,
        productCode: p.code,
        productName: p.name,
        clientName: p.clientName
      }));
    } else {
      alert("Produto não encontrado para este código de barras.");
      // Could allow registering here
      if (view === 'REGISTER_PRODUCT' || view === 'REGISTER_MATERIAL') {
         setProductForm(prev => ({ ...prev, barcode: code }));
      }
    }
  };

  // --- Views ---

  const renderSidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
      <div className="p-6 border-b flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6" />
          Estoque
        </h1>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>
      <nav className="p-4 space-y-2">
        <button onClick={() => setView('DASHBOARD')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${view === 'DASHBOARD' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
          <LayoutDashboard className="w-5 h-5" /> Dashboard
        </button>
        <div className="pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cadastros</div>
        <button onClick={() => { setView('REGISTER_MATERIAL'); setProductForm({ type: 'MATERIAL', unit: UnitOfMeasure.UN }); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${view === 'REGISTER_MATERIAL' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
          <PackagePlus className="w-5 h-5" /> Materiais (Entrada)
        </button>
        <button onClick={() => { setView('REGISTER_PRODUCT'); setProductForm({ type: 'FINISHED_GOOD', unit: UnitOfMeasure.UN }); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${view === 'REGISTER_PRODUCT' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
          <PackageMinus className="w-5 h-5" /> Produtos Prontos
        </button>
        <button onClick={() => setView('REGISTER_CLIENT')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${view === 'REGISTER_CLIENT' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
          <Users className="w-5 h-5" /> Clientes/Empresas
        </button>
        <div className="pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Registros</div>
        <button onClick={() => setView('LOG_ENTRY')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${view === 'LOG_ENTRY' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
          <ArrowDownCircle className="w-5 h-5" /> Reg. Entrada
        </button>
        <button onClick={() => setView('LOG_EXIT')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${view === 'LOG_EXIT' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
          <ArrowUpCircle className="w-5 h-5" /> Reg. Saída
        </button>
        <div className="pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Análises</div>
        <button onClick={() => setView('REPORTS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${view === 'REPORTS' ? 'bg-green-50 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}>
          <FileText className="w-5 h-5" /> Relatórios
        </button>
      </nav>
    </div>
  );

  const renderDashboard = () => {
    // Current Month Filter
    const monthlyTrans = transactions.filter(t => t.monthKey === currentMonth);
    const totalEntry = monthlyTrans.filter(t => t.type === 'ENTRY').reduce((acc, t) => acc + t.totalValue, 0);
    const totalExit = monthlyTrans.filter(t => t.type === 'EXIT').reduce((acc, t) => acc + t.totalValue, 0);

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
          <input 
            type="month" 
            value={currentMonth} 
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="border p-2 rounded-md bg-white text-gray-700"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-medium">Total Entradas ({currentMonth})</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">R$ {totalEntry.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm font-medium">Total Saídas ({currentMonth})</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">R$ {totalExit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
           <h3 className="font-semibold text-gray-700 mb-4">Atividade Recente</h3>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-gray-50 text-gray-600">
                 <tr>
                   <th className="p-3">Data</th>
                   <th className="p-3">Tipo</th>
                   <th className="p-3">Produto</th>
                   <th className="p-3 text-right">Valor</th>
                 </tr>
               </thead>
               <tbody>
                 {monthlyTrans.slice(-5).reverse().map(t => (
                   <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                     <td className="p-3">{new Date(t.date).toLocaleDateString()}</td>
                     <td className="p-3">
                       <span className={`px-2 py-1 rounded-full text-xs ${t.type === 'ENTRY' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                         {t.type === 'ENTRY' ? 'ENTRADA' : 'SAÍDA'}
                       </span>
                     </td>
                     <td className="p-3">{t.productName}</td>
                     <td className="p-3 text-right font-medium">R$ {t.totalValue.toFixed(2)}</td>
                   </tr>
                 ))}
                 {monthlyTrans.length === 0 && (
                   <tr><td colSpan={4} className="p-4 text-center text-gray-500">Nenhum registro este mês.</td></tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    );
  };

  const renderClientForm = () => (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Cadastro de Clientes/Empresas</h2>
      <form onSubmit={handleSaveClient} className="bg-white p-6 rounded-xl shadow-sm">
        <InputField 
          label="Código da Empresa" 
          value={clientForm.code || ''} 
          onChange={(e: any) => setClientForm({...clientForm, code: e.target.value})} 
          placeholder="Ex: EMP001"
        />
        <InputField 
          label="Nome da Empresa" 
          value={clientForm.name || ''} 
          onChange={(e: any) => setClientForm({...clientForm, name: e.target.value})} 
          placeholder="Ex: Fornecedor ABC Ltda"
        />
        <button type="submit" className="w-full mt-4 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-green-700 flex justify-center items-center gap-2">
          <Save className="w-5 h-5" /> Salvar Cliente
        </button>
      </form>

      <div className="mt-8">
        <h3 className="font-semibold text-gray-700 mb-4">Clientes Cadastrados</h3>
        <ul className="bg-white rounded-xl shadow-sm divide-y">
          {clients.map(c => (
            <li key={c.id} className="p-4 flex justify-between">
              <span>{c.name}</span>
              <span className="text-gray-400 text-sm">{c.code}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderProductForm = (type: 'MATERIAL' | 'FINISHED_GOOD') => (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {type === 'MATERIAL' ? 'Entrada de Materiais (Cadastro)' : 'Saída de Produtos Prontos (Cadastro)'}
      </h2>
      <form onSubmit={handleSaveProduct} className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
             <InputField 
              label="Código de Barras" 
              value={productForm.barcode || ''} 
              onChange={(e: any) => setProductForm({...productForm, barcode: e.target.value})}
              required={false}
            />
          </div>
          <button 
            type="button"
            onClick={() => triggerScan((code) => setProductForm(prev => ({...prev, barcode: code})))}
            className="mb-3 p-2 bg-gray-100 rounded-md border hover:bg-gray-200 text-gray-700"
          >
            <ScanLine className="w-6 h-6" />
          </button>
        </div>

        <InputField 
          label="Código do Produto" 
          value={productForm.code || ''} 
          onChange={(e: any) => setProductForm({...productForm, code: e.target.value})}
        />
        <InputField 
          label="Nome do Produto" 
          value={productForm.name || ''} 
          onChange={(e: any) => setProductForm({...productForm, name: e.target.value})}
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField 
            label="Valor Unitário (R$)" 
            type="number"
            value={productForm.value || ''} 
            onChange={(e: any) => setProductForm({...productForm, value: e.target.value})}
          />
           <SelectField 
            label="Unidade"
            value={productForm.unit}
            onChange={(e: any) => setProductForm({...productForm, unit: e.target.value})}
            options={Object.values(UnitOfMeasure).map(u => ({ value: u, label: u }))}
          />
        </div>
        
        <SelectField 
          label="Cliente Associado (Padrão)"
          value={productForm.clientName || ''}
          onChange={(e: any) => setProductForm({...productForm, clientName: e.target.value})}
          options={[{value: '', label: 'Selecione...'}, ...clients.map(c => ({ value: c.name, label: c.name }))]}
        />

        <button type="submit" className="w-full mt-4 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-green-700 flex justify-center items-center gap-2">
          <Save className="w-5 h-5" /> Cadastrar {type === 'MATERIAL' ? 'Material' : 'Produto'}
        </button>
      </form>
    </div>
  );

  const renderTransactionForm = (type: 'ENTRY' | 'EXIT') => (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {type === 'ENTRY' ? 'Registro de Entrada de Materiais' : 'Registro de Saída de Produtos'}
      </h2>
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6 text-sm text-yellow-800">
        Aba 4 e 5: Registros Mensais. Mês Atual: <strong>{currentMonth}</strong>.
      </div>

      <form onSubmit={(e) => handleTransaction(e, type)} className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        
         <div className="flex gap-2 items-end">
          <div className="flex-1">
             <InputField 
              label="Código de Barras (Scan)" 
              value={transactionForm.barcode || ''} 
              onChange={(e: any) => setTransactionForm({...transactionForm, barcode: e.target.value})}
              required={false}
              placeholder="Escaneie ou digite para buscar"
            />
          </div>
          <button 
            type="button"
            onClick={() => triggerScan(findProductByBarcode)}
            className="mb-3 p-2 bg-secondary text-white rounded-md border hover:bg-blue-600"
          >
            <ScanLine className="w-6 h-6" />
          </button>
        </div>

        <SelectField 
          label="Selecionar Produto (pelo Nome/Código)"
          value={transactionForm.productCode || ''}
          onChange={(e: any) => {
            const prod = products.find(p => p.code === e.target.value);
            if(prod) {
              setTransactionForm(prev => ({
                ...prev, 
                productCode: prod.code, 
                productName: prod.name, 
                barcode: prod.barcode,
                clientName: prod.clientName,
                unit: prod.unit
              }));
            }
          }}
          options={[
            {value: '', label: 'Selecione um produto...'}, 
            ...products
              .filter(p => type === 'ENTRY' ? p.type === 'MATERIAL' : p.type === 'FINISHED_GOOD')
              .map(p => ({ value: p.code, label: `${p.code} - ${p.name}` }))
          ]}
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField 
            label="Quantidade" 
            type="number"
            value={transactionForm.quantity || ''} 
            onChange={(e: any) => setTransactionForm({...transactionForm, quantity: e.target.value})}
          />
           <div className="pt-7 text-lg font-semibold text-gray-700">
             Total: R$ {((transactionForm.quantity || 0) * (products.find(p => p.code === transactionForm.productCode)?.value || 0)).toFixed(2)}
           </div>
        </div>

         <SelectField 
          label="Cliente/Destino"
          value={transactionForm.clientName || ''}
          onChange={(e: any) => setTransactionForm({...transactionForm, clientName: e.target.value})}
          options={[{value: '', label: 'Selecione...'}, ...clients.map(c => ({ value: c.name, label: c.name }))]}
        />

        <button type="submit" className={`w-full mt-4 text-white py-3 rounded-lg font-semibold flex justify-center items-center gap-2 ${type === 'ENTRY' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
          <Save className="w-5 h-5" /> Registrar {type === 'ENTRY' ? 'Entrada' : 'Saída'}
        </button>
      </form>
    </div>
  );

  const renderReports = () => {
    // Filter by current month
    const filteredTrans = transactions.filter(t => t.monthKey === currentMonth);
    
    const entryData = filteredTrans.filter(t => t.type === 'ENTRY');
    const exitData = filteredTrans.filter(t => t.type === 'EXIT');

    // Aggregate by Client for Charts
    const clientChartData = Object.entries(
      filteredTrans.reduce((acc, t) => {
        acc[t.clientName] = (acc[t.clientName] || 0) + t.totalValue;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));

    const callGemini = async () => {
      setIsAnalyzing(true);
      setAiAnalysis('');
      const analysis = await generateReportAnalysis(filteredTrans, 'GENERAL', currentMonth);
      setAiAnalysis(analysis);
      setIsAnalyzing(false);
    };

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Relatórios Mensais</h2>
           <div className="flex gap-4">
             <input 
              type="month" 
              value={currentMonth} 
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="border p-2 rounded-md bg-white text-gray-700"
            />
            <button 
              onClick={callGemini}
              disabled={isAnalyzing}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50"
            >
              <BrainCircuit className="w-5 h-5" />
              {isAnalyzing ? 'Analisando...' : 'Análise IA'}
            </button>
           </div>
        </div>

        {aiAnalysis && (
          <div className="bg-purple-50 border border-purple-200 p-6 rounded-xl mb-8 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5" /> Insights Gemini
            </h3>
            <div className="prose text-purple-800 whitespace-pre-wrap text-sm">
              {aiAnalysis}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
           <div className="bg-white p-6 rounded-xl shadow-sm h-80">
             <h3 className="font-semibold mb-4">Entradas vs Saídas</h3>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={[
                 { name: 'Entradas', valor: entryData.reduce((a, b) => a + b.totalValue, 0) },
                 { name: 'Saídas', valor: exitData.reduce((a, b) => a + b.totalValue, 0) }
               ]}>
                 <CartesianGrid strokeDasharray="3 3" />
                 <XAxis dataKey="name" />
                 <YAxis />
                 <RechartsTooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                 <Bar dataKey="valor" fill="#0F9D58" />
               </BarChart>
             </ResponsiveContainer>
           </div>
           
           <div className="bg-white p-6 rounded-xl shadow-sm h-80">
             <h3 className="font-semibold mb-4">Volume por Cliente</h3>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={clientChartData}>
                 <CartesianGrid strokeDasharray="3 3" />
                 <XAxis dataKey="name" />
                 <YAxis />
                 <RechartsTooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                 <Bar dataKey="value" fill="#4285F4" />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-2 text-green-700">Relatório Detalhado: Entradas</h3>
            <div className="bg-white rounded-lg shadow overflow-hidden">
               <table className="w-full text-xs">
                 <thead className="bg-gray-100">
                   <tr>
                     <th className="p-2">Data</th>
                     <th className="p-2">Produto</th>
                     <th className="p-2">Qtd</th>
                     <th className="p-2 text-right">Total</th>
                   </tr>
                 </thead>
                 <tbody>
                   {entryData.map(t => (
                     <tr key={t.id} className="border-b">
                       <td className="p-2">{new Date(t.date).toLocaleDateString()}</td>
                       <td className="p-2">{t.productName}</td>
                       <td className="p-2">{t.quantity} {t.unit}</td>
                       <td className="p-2 text-right">R$ {t.totalValue.toFixed(2)}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2 text-blue-700">Relatório Detalhado: Saídas</h3>
            <div className="bg-white rounded-lg shadow overflow-hidden">
               <table className="w-full text-xs">
                 <thead className="bg-gray-100">
                   <tr>
                     <th className="p-2">Data</th>
                     <th className="p-2">Produto</th>
                     <th className="p-2">Qtd</th>
                     <th className="p-2 text-right">Total</th>
                   </tr>
                 </thead>
                 <tbody>
                   {exitData.map(t => (
                     <tr key={t.id} className="border-b">
                       <td className="p-2">{new Date(t.date).toLocaleDateString()}</td>
                       <td className="p-2">{t.productName}</td>
                       <td className="p-2">{t.quantity} {t.unit}</td>
                       <td className="p-2 text-right">R$ {t.totalValue.toFixed(2)}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {renderSidebar()}
      
      <main className="flex-1 overflow-auto w-full relative">
        <header className="bg-white shadow-sm p-4 sticky top-0 z-30 md:hidden flex justify-between items-center">
          <h1 className="font-bold text-primary flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" /> Gestor
          </h1>
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </header>

        {view === 'DASHBOARD' && renderDashboard()}
        {view === 'REGISTER_CLIENT' && renderClientForm()}
        {view === 'REGISTER_MATERIAL' && renderProductForm('MATERIAL')}
        {view === 'REGISTER_PRODUCT' && renderProductForm('FINISHED_GOOD')}
        {view === 'LOG_ENTRY' && renderTransactionForm('ENTRY')}
        {view === 'LOG_EXIT' && renderTransactionForm('EXIT')}
        {view === 'REPORTS' && renderReports()}

      </main>

      {showScanner && (
        <BarcodeScanner 
          onScan={handleScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}
    </div>
  );
}