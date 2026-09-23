import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
 fetchDiscountCodes,
 addDiscountCode,
 updateDiscountCode,
 deleteDiscountCode,
} from "../../api/firebaseFunctions";
import {
 Loader2,
 Plus,
 Edit2,
 Trash2,
 X,
 Tag,
 ToggleLeft,
 ToggleRight,
 Calendar,
 Percent,
 DollarSign,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import toast from "react-hot-toast";

const initialFormState = {
 code: "",
 type: "percentage",
 value: "",
 expiresAt: "",
 isActive: true,
};

export default function DiscountCodes() {
 const [codes, setCodes] = useState([]);
 const [loading, setLoading] = useState(true);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [form, setForm] = useState(initialFormState);
 const [isSubmitting, setIsSubmitting] = useState(false);

 async function loadCodes() {
 setLoading(true);
 const data = await fetchDiscountCodes();
 setCodes(data);
 setLoading(false);
 }

 useEffect(() => {
 // eslint-disable-next-line react-hooks/set-state-in-effect
 loadCodes();
 }, []);

 const openModal = (code = null) => {
 if (code) {
 setEditingId(code.id);
 setForm({
 code: code.code || "",
 type: code.type || "percentage",
 value: code.value || "",
 expiresAt: code.expiresAt
 ? new Date(code.expiresAt.seconds * 1000).toISOString().split("T")[0]
 : "",
 isActive: code.isActive !== false,
 });
 } else {
 setEditingId(null);
 setForm(initialFormState);
 }
 setIsModalOpen(true);
 };

 const closeModal = () => {
 setIsModalOpen(false);
 setEditingId(null);
 setForm(initialFormState);
 };

 const handleSubmit = async (e) => {
 e.preventDefault();

 if (!form.code.trim()) {
 toast.error("Please enter a code");
 return;
 }
 if (!form.value || Number(form.value) <= 0) {
 toast.error("Please enter a valid discount value");
 return;
 }
 if (form.type === "percentage" && Number(form.value) > 100) {
 toast.error("Percentage cannot exceed 100%");
 return;
 }

 setIsSubmitting(true);
 try {
 const data = {
 code: form.code.trim(),
 type: form.type,
 value: Number(form.value),
 expiresAt: form.expiresAt
 ? new Date(form.expiresAt + "T23:59:59")
 : null,
 isActive: form.isActive,
 };

 if (editingId) {
 await updateDiscountCode(editingId, data);
 toast.success("Code updated");
 } else {
 const result = await addDiscountCode(data);
 if (!result.success) {
 toast.error(result.error || "Failed to add code");
 setIsSubmitting(false);
 return;
 }
 toast.success("Code created");
 }
 closeModal();
 loadCodes();
 } catch {
 toast.error("Something went wrong");
 }
 setIsSubmitting(false);
 };

 const handleToggleActive = async (code) => {
 const success = await updateDiscountCode(code.id, {
 isActive: !code.isActive,
 });
 if (success) {
 toast.success(code.isActive ? "Code deactivated" : "Code activated");
 loadCodes();
 } else {
 toast.error("Failed to update");
 }
 };

 const handleDelete = async (id) => {
 if (!window.confirm("Delete this discount code?")) return;
 const success = await deleteDiscountCode(id);
 if (success) {
 toast.success("Code deleted");
 loadCodes();
 } else {
 toast.error("Failed to delete");
 }
 };

 const isExpired = (code) => {
 if (!code.expiresAt) return false;
 const expires = code.expiresAt.seconds
 ? new Date(code.expiresAt.seconds * 1000)
 : new Date(code.expiresAt);
 return expires < new Date();
 };

 const activeCount = codes.filter((c) => c.isActive && !isExpired(c)).length;

 return (
 <AdminLayout title="Discount Codes">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
 <span className="text-black">{activeCount}</span> active · {codes.length} total
 </p>
 <p className="text-sm text-gray-500">Promo codes applied at checkout.</p>
 </div>
 <button
 onClick={() => openModal()}
 className="focus-ring flex items-center gap-2 px-5 py-2.5 bg-black text-white text-[11px] font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover active:scale-[0.98]"
 >
 <Plus size={16} />
 Add Code
 </button>
 </div>

 {/* Table */}
 {loading ? (
 <div className="flex items-center justify-center py-20">
 <Loader2 className="animate-spin text-black/20" size={28} />
 </div>
 ) : codes.length === 0 ? (
 <Card className="border-black/[0.06]">
 <CardContent className="flex flex-col items-center justify-center py-20 text-center">
 <div className="w-16 h-16 rounded-2xl bg-black/[0.04] flex items-center justify-center mb-4">
 <Tag className="text-gray-300" size={30} />
 </div>
 <p className="text-gray-900 font-medium mb-1">No discount codes yet</p>
 <p className="text-gray-400 text-sm mb-6">Create your first promo code to run a campaign.</p>
 <button
 onClick={() => openModal()}
 className="focus-ring flex items-center gap-2 px-6 py-3 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 shadow-card transition-all"
 >
 <Plus size={15} />
 Create your first code
 </button>
 </CardContent>
 </Card>
 ) : (
 <>
 {/* Mobile Cards */}
 <div className="md:hidden space-y-3">
 {codes.map((code) => (
 <div
 key={code.id}
 className={`bg-white p-4 rounded-xl border ${
 isExpired(code) ? "border-rose-100 opacity-60" : "border-black/[0.06]"
 } shadow-card`}
 >
 <div className="flex items-start justify-between mb-3">
 <div>
 <span className="font-mono font-bold text-sm tracking-wider bg-black text-white px-2.5 py-1 rounded-lg">
 {code.code}
 </span>
 <div className="flex items-center gap-2 mt-2 flex-wrap">
 {code.type === "percentage" ? (
 <span className="flex items-center gap-1 text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-100">
 <Percent size={10} /> {code.value}%
 </span>
 ) : (
 <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
 <DollarSign size={10} /> ₦
 {Number(code.value).toLocaleString()}
 </span>
 )}
 {isExpired(code) ? (
 <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
 Expired
 </span>
 ) : code.isActive ? (
 <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
 Active
 </span>
 ) : (
 <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
 Inactive
 </span>
 )}
 </div>
 {code.expiresAt && (
 <p className="text-[10px] text-gray-400 flex items-center gap-1 mb-3 mt-2">
 <Calendar size={10} />
 Expires{" "}
 {new Date(
 code.expiresAt.seconds * 1000
 ).toLocaleDateString()}
 </p>
 )}
 </div>
 </div>
 <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.05]">
 <button
 onClick={() => handleToggleActive(code)}
 className={`focus-ring flex items-center justify-center gap-1 p-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${
 code.isActive
 ? "bg-emerald-50 text-emerald-600 border-emerald-100"
 : "bg-slate-100 text-gray-500 border-slate-200"
 }`}
 >
 {code.isActive ? (
 <ToggleRight size={14} />
 ) : (
 <ToggleLeft size={14} />
 )}
 {code.isActive ? "On" : "Off"}
 </button>
 <button
 onClick={() => openModal(code)}
 className="focus-ring flex items-center justify-center p-2 bg-black/[0.03] text-gray-600 rounded-lg border border-black/[0.06] hover:bg-black/[0.06]"
 >
 <Edit2 size={14} />
 </button>
 <button
 onClick={() => handleDelete(code.id)}
 className="focus-ring flex items-center justify-center p-2 bg-rose-50 text-rose-500 rounded-lg border border-rose-100 hover:bg-rose-100"
 >
 <Trash2 size={14} />
 </button>
 </div>
 </div>
 ))}
 </div>

 {/* Desktop Table */}
 <div className="hidden md:block bg-white rounded-xl border border-black/[0.06] shadow-card overflow-hidden">
 <table className="w-full admin-table">
 <thead>
 <tr className="border-b border-black/[0.06] bg-black/[0.02]">
 <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-3">
 Code
 </th>
 <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-3">
 Type
 </th>
 <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-3">
 Value
 </th>
 <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-3">
 Expires
 </th>
 <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-3">
 Status
 </th>
 <th className="text-right text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-3">
 Actions
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-black/[0.05]">
 {codes.map((code) => (
 <tr
 key={code.id}
 className={`hover:bg-black/[0.02] transition-colors ${
 isExpired(code) ? "opacity-50" : ""
 }`}
 >
 <td className="px-6 py-4">
 <span className="font-mono font-bold text-sm tracking-wider bg-black text-white px-2.5 py-1 rounded-lg">
 {code.code}
 </span>
 </td>
 <td className="px-6 py-4">
 <span
 className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${
 code.type === "percentage"
 ? "text-violet-600"
 : "text-emerald-600"
 }`}
 >
 {code.type === "percentage" ? (
 <Percent size={12} />
 ) : (
 <DollarSign size={12} />
 )}
 {code.type === "percentage" ? "Percentage" : "Fixed"}
 </span>
 </td>
 <td className="px-6 py-4 font-bold text-sm">
 {code.type === "percentage"
 ? `${code.value}%`
 : `₦${Number(code.value).toLocaleString()}`}
 </td>
 <td className="px-6 py-4 text-sm text-gray-500">
 {code.expiresAt
 ? new Date(
 code.expiresAt.seconds * 1000
 ).toLocaleDateString()
 : "-"}
 </td>
 <td className="px-6 py-4">
 {isExpired(code) ? (
 <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100">
 Expired
 </span>
 ) : code.isActive ? (
 <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
 Active
 </span>
 ) : (
 <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
 Inactive
 </span>
 )}
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex justify-end items-center gap-2">
 <button
 onClick={() => handleToggleActive(code)}
 className={`focus-ring p-1.5 rounded-lg border transition-colors ${
 code.isActive
 ? "bg-emerald-50 text-emerald-600 border-emerald-100"
 : "bg-slate-100 text-gray-500 border-slate-200"
 }`}
 title={code.isActive ? "Deactivate" : "Activate"}
 >
 {code.isActive ? (
 <ToggleRight size={16} />
 ) : (
 <ToggleLeft size={16} />
 )}
 </button>
 <button
 onClick={() => openModal(code)}
 className="focus-ring p-2 text-gray-600 hover:text-black hover:bg-black/[0.04] rounded-lg border border-transparent hover:border-black/[0.06]"
 >
 <Edit2 size={16} />
 </button>
 <button
 onClick={() => handleDelete(code.id)}
 className="focus-ring p-2 text-rose-500 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100"
 >
 <Trash2 size={16} />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </>
 )}

 {/* Add / Edit Modal */}
 {isModalOpen && (
 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-2xl w-full max-w-md shadow-raised border border-black/[0.06]">
 <div className="flex items-center justify-between p-6 border-b border-black/[0.06]">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
 {editingId ? "Update promo" : "New promo code"}
 </p>
 <h2 className="font-bold text-lg text-gray-900">
 {editingId ? "Edit Code" : "New Code"}
 </h2>
 </div>
 <button
 onClick={closeModal}
 className="focus-ring p-2 hover:bg-black/[0.04] rounded-lg transition-colors"
 >
 <X size={18} />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-5">
 {/* Code */}
 <div>
 <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
 Discount Code
 </label>
 <input
 type="text"
 value={form.code}
 onChange={(e) =>
 setForm({ ...form, code: e.target.value.toUpperCase() })
 }
 placeholder="e.g. NYNTH20"
 className="w-full px-4 py-3 border border-black/[0.08] rounded-lg text-sm font-mono font-bold tracking-wider uppercase focus-ring transition-colors"
 required
 />
 </div>

 {/* Type + Value */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
 Type
 </label>
 <select
 value={form.type}
 onChange={(e) =>
 setForm({ ...form, type: e.target.value })
 }
 className="w-full px-4 py-3 border border-black/[0.08] rounded-lg text-sm focus-ring transition-colors bg-white cursor-pointer"
 >
 <option value="percentage">Percentage (%)</option>
 <option value="fixed">Fixed Amount (₦)</option>
 </select>
 </div>
 <div>
 <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
 {form.type === "percentage"
 ? "Percentage Off"
 : "Amount Off (₦)"}
 </label>
 <input
 type="number"
 min="0"
 max={form.type === "percentage" ? "100" : undefined}
 value={form.value}
 onChange={(e) =>
 setForm({ ...form, value: e.target.value })
 }
 placeholder={form.type === "percentage" ? "20" : "2000"}
 className="w-full px-4 py-3 border border-black/[0.08] rounded-lg text-sm focus-ring transition-colors"
 required
 />
 </div>
 </div>

 {/* Expiry */}
 <div>
 <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
 Expiry Date (Optional)
 </label>
 <input
 type="date"
 value={form.expiresAt}
 onChange={(e) =>
 setForm({ ...form, expiresAt: e.target.value })
 }
 className="w-full px-4 py-3 border border-black/[0.08] rounded-lg text-sm focus-ring transition-colors"
 />
 </div>

 {/* Active Toggle */}
 <div className="flex items-center justify-between py-3 px-4 bg-black/[0.02] rounded-xl border border-black/[0.06]">
 <div>
 <span className="text-sm font-medium text-gray-900 block">Active</span>
 <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Code available at checkout</span>
 </div>
 <button
 type="button"
 onClick={() =>
 setForm({ ...form, isActive: !form.isActive })
 }
 aria-label="Toggle active"
 className={`focus-ring p-0.5 rounded-lg transition-colors ${
 form.isActive ? "bg-black" : "bg-black/[0.15]"
 }`}
 >
 <div
 className={`w-5 h-5 rounded-lg bg-white shadow transition-transform ${
 form.isActive ? "translate-x-5" : "translate-x-0"
 }`}
 />
 </button>
 </div>

 {/* Actions */}
 <div className="flex gap-3 pt-2">
 <button
 type="button"
 onClick={closeModal}
 className="focus-ring flex-1 py-3 text-sm font-bold border border-black/[0.1] rounded-lg hover:bg-black/[0.02] transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={isSubmitting}
 className="focus-ring flex-1 py-3 text-sm font-bold bg-black text-white rounded-lg hover:bg-gray-800 shadow-card transition-all disabled:opacity-50 flex items-center justify-center gap-2"
 >
 {isSubmitting && <Loader2 size={14} className="animate-spin" />}
 {editingId ? "Save Changes" : "Create Code"}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </AdminLayout>
 );
}