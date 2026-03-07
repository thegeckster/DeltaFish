import { useState, useMemo } from 'react';
import { getSettings, saveSettings, exportTripsCSV, exportTripsJSON, getTrips, AppSettings } from '../lib/storage';
import { Save, Download, Key, MapPin, CheckCircle } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());
  const [saved, setSaved] = useState(false);
  const tripCount = useMemo(() => getTrips().length, []);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportCSV = () => {
    const csv = exportTripsCSV();
    if (!csv) return alert('No trips to export');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deltafish-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const json = exportTripsJSON();
    if (json === '[]') return alert('No trips to export');
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deltafish-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-4">Settings</h2>

      <div className="space-y-4">
        {/* API Key */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-700">OpenAI API Key</h3>
          </div>
          <p className="text-xs text-slate-500 mb-2">
            Required for voice trip logging. Get your key at platform.openai.com
          </p>
          <input
            type="password"
            value={settings.openai_api_key}
            onChange={e => setSettings(s => ({ ...s, openai_api_key: e.target.value }))}
            placeholder="sk-..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Default Launch */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-700">Default Launch Location</h3>
          </div>
          <input
            type="text"
            value={settings.default_launch_location}
            onChange={e => setSettings(s => ({ ...s, default_launch_location: e.target.value }))}
            placeholder="e.g., Russo's Marina"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>

        {/* Data Management */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Data ({tripCount} trips)</h3>
          <div className="space-y-2">
            <button
              onClick={handleExportCSV}
              className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export as CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Full Backup (JSON)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
