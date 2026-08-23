import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, Droplet, MapPin, Phone, Plus, X } from "lucide-react";
import { api } from "../lib/api";
import { BLOOD_GROUPS, DIVISIONS } from "../lib/bloodUtils";
import PulseMark from "../components/PulseMark";

const emptyStock = Object.fromEntries(BLOOD_GROUPS.map((g) => [g, 0]));

export default function AdminBloodBanks() {
  const [query, setQuery] = useState("");
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "", division: "Dhaka", stock: emptyStock });
  const [saving, setSaving] = useState(false);

  const loadBanks = async (q) => {
    const { bloodBanks } = await api.bloodBanks.list({ q: q || undefined, limit: 300 });
    setBanks(bloodBanks);
  };

  useEffect(() => {
    (async () => {
      await loadBanks();
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => loadBanks(query), 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const startEdit = (bank) => {
    setEditingId(bank.id);
    setEditStock({ ...bank.stock });
  };

  const saveStock = async (bank) => {
    await api.bloodBanks.update(bank.id, { stock: editStock });
    setBanks((prev) => prev.map((b) => (b.id === bank.id ? { ...b, stock: editStock } : b)));
    setEditingId(null);
  };

  const removeBank = async (bank) => {
    if (!window.confirm(`Remove ${bank.name}?`)) return;
    await api.bloodBanks.remove(bank.id);
    setBanks((prev) => prev.filter((b) => b.id !== bank.id));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { bloodBank: created } = await api.bloodBanks.create(form);
      setBanks((prev) => [created, ...prev]);
      setOpen(false);
      setForm({ name: "", address: "", phone: "", division: "Dhaka", stock: emptyStock });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <PulseMark size={48} ring />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-sky-950">Blood Banks</h1>
          <p className="text-sm text-sky-900/50 mt-1">{banks.length} partner blood bank(s)</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-admin text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add Blood Bank
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-sky-100 p-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search blood banks..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-sky-200 focus-ring-admin text-sm"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {banks.map((bank) => {
          const isEditing = editingId === bank.id;
          const total = Object.values(bank.stock).reduce((a, b) => a + b, 0);
          return (
            <motion.div
              key={bank.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-sky-100 p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display font-semibold text-sky-950">{bank.name}</h3>
                  <p className="text-xs text-sky-900/50 flex items-center gap-1 mt-1">
                    <MapPin size={11} /> {bank.address}
                  </p>
                  <p className="text-xs text-sky-900/50 flex items-center gap-1 mt-1">
                    <Phone size={11} /> {bank.phone}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                    <Droplet size={16} />
                  </div>
                  <button
                    onClick={() => removeBank(bank)}
                    className="p-2 rounded-lg text-sky-900/40 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove blood bank"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-sky-900/40 mt-1">{total} units total</p>

              <div className="grid grid-cols-4 gap-2 mt-4">
                {BLOOD_GROUPS.map((g) => (
                  <div key={g} className="rounded-xl bg-sky-50 py-2 text-center">
                    <p className="text-xs font-bold text-sky-700">{g}</p>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editStock[g]}
                        onChange={(e) => setEditStock((s) => ({ ...s, [g]: Number(e.target.value) }))}
                        className="w-full text-center text-sm font-semibold bg-transparent border-b border-sky-300 focus:outline-none"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-sky-950">{bank.stock[g]}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                {isEditing ? (
                  <>
                    <button onClick={() => setEditingId(null)} className="text-xs font-semibold text-sky-900/50 px-3 py-1.5">
                      Cancel
                    </button>
                    <button
                      onClick={() => saveStock(bank)}
                      className="text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Save stock
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startEdit(bank)}
                    className="text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Edit stock
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
        {banks.length === 0 && (
          <p className="text-sm text-sky-900/40 text-center py-10 lg:col-span-2">No blood banks match your search.</p>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-sky-950">Add Blood Bank</h2>
                <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-sky-50 text-sky-700">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-sky-950">Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-sky-200 text-sm focus-ring-admin"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-sky-950">Address</label>
                  <input
                    required
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-sky-200 text-sm focus-ring-admin"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-sky-950">Phone</label>
                    <input
                      required
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-sky-200 text-sm focus-ring-admin"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-sky-950">Division</label>
                    <select
                      value={form.division}
                      onChange={(e) => setForm((f) => ({ ...f, division: e.target.value }))}
                      className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-sky-200 text-sm focus-ring-admin"
                    >
                      {DIVISIONS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 rounded-xl gradient-admin text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {saving ? "Adding…" : "Add blood bank"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
