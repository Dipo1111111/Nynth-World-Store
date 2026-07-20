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

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    setLoading(true);
    const data = await fetchDiscountCodes();
    setCodes(data);
    setLoading(false);
  };

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
    } catch (err) {
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

  return (
    <AdminLayout title="Discount Codes">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {codes.length} code{codes.length !== 1 ? "s" : ""} total
        </p>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-black text-white text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus size={16} />
          Add Code
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      ) : codes.length === 0 ? (
        <div className="text-center py-20">
          <Tag className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-400 font-medium">No discount codes yet</p>
          <button
            onClick={() => openModal()}
            className="mt-3 text-sm text-black font-bold underline"
          >
            Create your first code
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {codes.map((code) => (
              <div
                key={code.id}
                className={`bg-white p-4 rounded-xl border ${
                  isExpired(code)
                    ? "border-red-100 opacity-60"
                    : "border-gray-100"
                } shadow-sm`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-mono font-bold text-sm tracking-wider bg-gray-100 px-2 py-1 rounded">
                      {code.code}
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      {code.type === "percentage" ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                          <Percent size={10} /> {code.value}%
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                          <DollarSign size={10} /> ₦
                          {Number(code.value).toLocaleString()}
                        </span>
                      )}
                      {isExpired(code) ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                          Expired
                        </span>
                      ) : code.isActive ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                          Active
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {code.expiresAt && (
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 mb-3">
                    <Calendar size={10} />
                    Expires{" "}
                    {new Date(
                      code.expiresAt.seconds * 1000
                    ).toLocaleDateString()}
                  </p>
                )}
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
                  <button
                    onClick={() => handleToggleActive(code)}
                    className={`flex items-center justify-center gap-1 p-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${
                      code.isActive
                        ? "bg-green-50 text-green-600 border-green-100"
                        : "bg-gray-50 text-gray-400 border-gray-200"
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
                    className="flex items-center justify-center p-2 bg-gray-50 text-gray-600 rounded-lg border border-black/5 hover:bg-gray-100"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(code.id)}
                    className="flex items-center justify-center p-2 bg-red-50 text-red-500 rounded-lg border border-red-100 hover:bg-red-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
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
              <tbody>
                {codes.map((code) => (
                  <tr
                    key={code.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      isExpired(code) ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-sm tracking-wider bg-gray-100 px-2.5 py-1 rounded">
                        {code.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${
                          code.type === "percentage"
                            ? "text-purple-600"
                            : "text-green-600"
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
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {isExpired(code) ? (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
                          Expired
                        </span>
                      ) : code.isActive ? (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-100">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-gray-50 text-gray-400 border border-gray-200">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(code)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            code.isActive
                              ? "bg-green-50 text-green-600 border-green-100"
                              : "bg-gray-50 text-gray-400 border-gray-200"
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
                          className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg border border-transparent hover:border-black/5"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(code.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-lg">
                {editingId ? "Edit Code" : "New Code"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg"
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
                  className="w-full px-4 py-3 border border-black/8 rounded-lg text-sm font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-black/20 transition-colors"
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
                    className="w-full px-4 py-3 border border-black/8 rounded-lg text-sm focus:outline-none focus:border-black/20 transition-colors bg-white"
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
                    className="w-full px-4 py-3 border border-black/8 rounded-lg text-sm focus:outline-none focus:border-black/20 transition-colors"
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
                  className="w-full px-4 py-3 border border-black/8 rounded-lg text-sm focus:outline-none focus:border-black/20 transition-colors"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Active</span>
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, isActive: !form.isActive })
                  }
                  className={`p-0.5 rounded-full transition-colors ${
                    form.isActive ? "bg-black" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
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
                  className="flex-1 py-3 text-sm font-bold border border-black/10 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 text-sm font-bold bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
