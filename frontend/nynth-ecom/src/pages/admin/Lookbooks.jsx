import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { fetchLookbooks, uploadImage, addLookbook, deleteLookbook, subscribeLookbooks } from "../../api/firebaseFunctions";
import { Loader2, Plus, Trash2, Upload, CheckCircle, X, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { compressImage } from "../../utils/imageUtils";

export default function AdminLookbooks() {
 const [lookbooks, setLookbooks] = useState([]);
 const [loading, setLoading] = useState(true);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);

 // Delete Confirmation State
 const [deleteConfirmId, setDeleteConfirmId] = useState(null);
 const [isDeleting, setIsDeleting] = useState(false);

 // Form State - Minimal
 const initialFormState = {
 image: null,
 imageUrl: ""
 };

 const [formData, setFormData] = useState(initialFormState);
 const [submitStep, setSubmitStep] = useState(""); // "", "compressing", "uploading", "saving"

 const loadLookbooks = async (isManual = false) => {
 try {
 setLoading(true);
 const data = await fetchLookbooks();

 setLookbooks(data);
 if (isManual) toast.success("Refreshed!");
 } catch (error) {
 console.error("Manual Fetch Error:", error);
 toast.error("Failed to fetch lookbooks: " + error.message);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 setLoading(true);
 loadLookbooks();
 const unsubscribe = subscribeLookbooks(() => loadLookbooks(true));
 return () => unsubscribe();
 }, []);

 const resetForm = () => {
 setFormData(initialFormState);
 setSubmitStep("");
 };

 const handleImageChange = (e) => {
 if (e.target.files[0]) {
 setFormData({ ...formData, image: e.target.files[0] });
 }
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!formData.image && !formData.imageUrl) {
 toast.error("Please select an image");
 return;
 }

 try {
 setIsSubmitting(true);
 let finalImageUrl = formData.imageUrl;

 if (formData.image) {
 setSubmitStep("compressing");
 toast.loading("Compressing look image...", { id: "look-upload" });
 const compressedFile = await compressImage(formData.image, { maxSizeMB: 1.5 });

 setSubmitStep("uploading");
 toast.loading("Uploading look image...", { id: "look-upload" });
 finalImageUrl = await uploadImage(compressedFile);
 toast.success("Image uploaded", { id: "look-upload" });
 }

 setSubmitStep("saving");
 await addLookbook({ image: finalImageUrl });

 toast.success("Look added successfully!");
 setIsModalOpen(false);
 resetForm();
 } catch (error) {
 console.error(error);
 toast.error("Failed to add look: " + error.message);
 } finally {
 setIsSubmitting(false);
 }
 };

 const confirmDelete = async () => {
 if (!deleteConfirmId) return;
 try {
 setIsDeleting(true);
 await deleteLookbook(deleteConfirmId);
 toast.success("Look deleted");
 setDeleteConfirmId(null);
 } catch {
 toast.error("Failed to delete");
 } finally {
 setIsDeleting(false);
 }
 };

 return (
 <AdminLayout title="Lookbook Management">
 {/* Action Bar */}
 <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 mb-1">Editorial Archive</p>
 <h2 className="text-2xl font-bold text-[#EDEAE2]">Gallery</h2>
 <p className="text-[#EDEAE2]/42 text-sm mt-1">Manage your editorial imagery.</p>
 </div>
 <div className="flex gap-3">
 <button
 onClick={() => loadLookbooks(true)}
 className="focus-ring px-5 py-2.5 border border-white/14 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/[0.05] transition-all active:scale-[0.98]"
 >
 Refresh
 </button>
 <button
 onClick={() => setIsModalOpen(true)}
 className="focus-ring flex items-center gap-2 btn-primary px-6 py-2.5 shadow-card active:scale-[0.98]"
 >
 <Plus size={18} />
 <span className="text-[11px] tracking-widest font-bold uppercase">Add New Look</span>
 </button>
 </div>
 </div>

 {loading ? (
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
 {Array.from({ length: 10 }).map((_, i) => (
 <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
 ))}
 </div>
 ) : lookbooks.length === 0 ? (
 <div className="bg-[#0a0a0a] border border-dashed border-white/22 rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-card">
 <div className="w-16 h-16 bg-white/[0.09] rounded-2xl flex items-center justify-center mb-6">
 <Upload className="w-8 h-8 text-[#EDEAE2]/35" />
 </div>
 <h3 className="text-xl font-bold text-[#EDEAE2] mb-2">No Looks Found</h3>
 <p className="text-[#EDEAE2]/42 text-sm mb-8">Start by adding your first visual to the collection.</p>
 <button
 onClick={() => setIsModalOpen(true)}
 className="btn-primary focus-ring flex items-center gap-3 px-8 py-4 shadow-card"
 >
 <Plus size={18} />
 <span className="text-xs tracking-widest font-bold uppercase">Add First Look</span>
 </button>
 </div>
 ) : (
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
 {lookbooks.map((look) => (
 <div key={look.id} className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover relative group aspect-[3/4]">
 <img src={look.image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />

 {/* Persistent Delete Button for Mobile/Desktop Accessibility */}
 <button
 onClick={() => setDeleteConfirmId(look.id)}
 className="absolute bottom-3 right-3 bg-[#0a0a0a]/90 backdrop-blur-sm text-rose-300 p-2.5 rounded-lg shadow-card hover:bg-white/15 hover:scale-110 active:scale-90 transition-all duration-300 z-10"
 aria-label="Delete Look"
 >
 <Trash2 size={16} />
 </button>
 </div>
 ))}
 </div>
 )}

 {/* Upload Modal */}
 {isModalOpen && (
 <div
 className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300"
 onClick={(e) => {
 if (e.target === e.currentTarget) {
 setIsModalOpen(false);
 resetForm();
 }
 }}
 >
 <div className="bg-[#0a0a0a] rounded-2xl w-full max-w-lg p-8 shadow-raised animate-in zoom-in-95 duration-300 border border-white/10 my-auto">
 <div className="flex justify-between items-center mb-8">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 mb-1">New Editorial Image</p>
 <h2 className="text-2xl font-bold text-[#EDEAE2]">Upload Visual</h2>
 </div>
 <button onClick={() => setIsModalOpen(false)} className="focus-ring p-2 hover:bg-white/[0.09] rounded-lg transition-colors">
 <X size={20} />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="space-y-8">
 <div className="border-2 border-dashed border-white/22 rounded-2xl p-16 text-center cursor-pointer hover:border-white/45 hover:bg-white/[0.05] transition-all relative group">
 <input
 type="file"
 onChange={handleImageChange}
 accept="image/*"
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
 />
 {formData.image ? (
 <div className="flex flex-col items-center gap-4 text-emerald-300">
 <div className="w-16 h-16 bg-emerald-500/[0.14] rounded-xl flex items-center justify-center">
 <CheckCircle size={32} />
 </div>
 <span className="text-sm font-bold uppercase tracking-widest">{formData.image.name}</span>
 </div>
 ) : (
 <div className="flex flex-col items-center text-[#EDEAE2]/35 group-hover:text-[#EDEAE2]/42 transition-colors">
 <div className="w-16 h-16 bg-white/[0.09] rounded-2xl flex items-center justify-center mb-6">
 <Plus size={32} />
 </div>
 <span className="font-bold uppercase tracking-[0.2em] text-[10px]">Select Image File</span>
 </div>
 )}
 </div>

 <div className="flex gap-4">
 <button
 type="button"
 onClick={() => {
 setIsModalOpen(false);
 resetForm();
 }}
 className="focus-ring flex-1 py-4 border border-white/14 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/[0.05] transition-all"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={isSubmitting || !formData.image}
 className="focus-ring flex-[1.5] py-4 bg-[#EDEAE2] text-[#0d0d0f] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black/90 disabled:opacity-20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
 >
 {isSubmitting ? (
 <>
 <Loader2 className="animate-spin" size={14} />
 <span>{submitStep.toUpperCase()}...</span>
 </>
 ) : (
 <>
 <div className="w-1.5 h-1.5 bg-[#0a0a0a] rounded-lg animate-pulse"></div>
 <span>Create Look</span>
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* DELETE CONFIRMATION MODAL */}
 {deleteConfirmId && (
<div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
<div className="bg-[#0a0a0a] rounded-2xl w-full max-w-sm p-10 text-center shadow-raised animate-in zoom-in-95 duration-200 border border-white/10 my-auto">
 <div className="w-20 h-20 bg-rose-500/[0.14] rounded-2xl flex items-center justify-center mx-auto mb-8">
 <AlertTriangle className="text-rose-300" size={32} strokeWidth={1.5} />
 </div>
 <h3 className="text-2xl font-bold mb-4 text-[#EDEAE2]">Are you sure?</h3>
 <p className="text-[#EDEAE2]/42 text-sm mb-10 leading-relaxed uppercase tracking-widest font-bold text-[9px]">
 This will permanently remove this look from the website.
 </p>

 <div className="flex flex-col gap-3">
 <button
 onClick={confirmDelete}
 disabled={isDeleting}
 className="focus-ring w-full py-4 bg-rose-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
 >
 {isDeleting ? <Loader2 className="animate-spin" size={14} /> : "Yes, Delete Permanently"}
 </button>
 <button
 onClick={() => setDeleteConfirmId(null)}
 disabled={isDeleting}
 className="focus-ring w-full py-4 bg-white/[0.07] text-[#EDEAE2] border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/[0.11] transition-all active:scale-[0.98]"
 >
 Wait, Go Back
 </button>
 </div>
 </div>
 </div>
 )}
 </AdminLayout>
 );
}