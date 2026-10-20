import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminButton from "../../components/admin/AdminButton";
import AdminCard from "../../components/admin/AdminCard";
import AdminModal from "../../components/admin/AdminModal";
import PageHeader from "../../components/admin/PageHeader";
import { fetchLookbooks, uploadImage, addLookbook, deleteLookbook, subscribeLookbooks } from "../../api/firebaseFunctions";
import { useAuth } from "../../context/AuthContext";
import { Loader2, Plus, Trash2, Upload, CheckCircle, X, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { compressImage } from "../../utils/imageUtils";

export default function AdminLookbooks() {
 const { can: canAny } = useAuth();
 const canManageLookbooks = canAny("store.lookbooks.manage");
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
 <PageHeader
 eyebrow="Editorial Archive"
 title="Gallery"
 description="Manage your editorial imagery."
 actions={(
 <>
 <AdminButton variant="secondary" onClick={() => loadLookbooks(true)}>
 Refresh
 </AdminButton>
 {canManageLookbooks && (
 <AdminButton icon={Plus} onClick={() => setIsModalOpen(true)}>
 Add New Look
 </AdminButton>
 )}
 </>
 )}
 />

 {loading ? (
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
 {Array.from({ length: 10 }).map((_, i) => (
 <div key={i} className="skeleton aspect-[3/4] rounded-xl" />
 ))}
 </div>
 ) : lookbooks.length === 0 ? (
 <AdminCard level="dashed" padding="lg" className="flex flex-col items-center justify-center text-center">
 <div className="w-16 h-16 bg-[var(--admin-ink)]/[0.06] rounded-xl flex items-center justify-center mb-6">
 <Upload className="w-8 h-8 text-[var(--admin-ink)]/35" />
 </div>
 <h3 className="text-xl font-bold text-[var(--admin-ink)] mb-2">No Looks Found</h3>
 <p className="text-sm text-[var(--admin-ink)]/55 mb-8 leading-relaxed">Start by adding your first visual to the collection.</p>
 {canManageLookbooks && (
 <AdminButton icon={Plus} onClick={() => setIsModalOpen(true)}>
 Add First Look
 </AdminButton>
 )}
 </AdminCard>
 ) : (
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
 {lookbooks.map((look) => (
 <AdminCard key={look.id} className="overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover relative group aspect-[3/4]">
 <img src={look.image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />

 {/* Persistent Delete Button for Mobile/Desktop Accessibility */}
 {canManageLookbooks && (
 <button
 onClick={() => setDeleteConfirmId(look.id)}
 className="absolute bottom-3 right-3 bg-[var(--admin-surface)]/90 backdrop-blur-sm text-[var(--tint-rose-fg)] p-2.5 rounded-lg shadow-card hover:bg-[var(--tint-rose-bg)] active:scale-95 transition-all duration-150 z-10 focus-ring"
 aria-label="Delete Look"
 >
 <Trash2 size={16} />
 </button>
 )}
 </AdminCard>
 ))}
 </div>
 )}

 {/* Upload Modal */}
 {isModalOpen && (
 <AdminModal
 onClose={() => {
 setIsModalOpen(false);
 resetForm();
 }}
 eyebrow="New Editorial Image"
 title="Upload Visual"
 size="md"
 >
 <form onSubmit={handleSubmit} className="space-y-6">
 <div className="border-2 border-dashed border-[var(--admin-ink)]/22 rounded-xl p-10 text-center cursor-pointer hover:border-[var(--admin-ink)]/45 hover:bg-[var(--admin-hover)] transition-all relative group">
 <input
 type="file"
 onChange={handleImageChange}
 accept="image/*"
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
 />
 {formData.image ? (
 <div className="flex flex-col items-center gap-4 text-[var(--tint-emerald-fg)]">
 <div className="w-16 h-16 bg-[var(--tint-emerald-bg)] rounded-xl flex items-center justify-center">
 <CheckCircle size={32} />
 </div>
 <span className="text-sm font-bold uppercase tracking-widest">{formData.image.name}</span>
 </div>
 ) : (
 <div className="flex flex-col items-center text-[var(--admin-ink)]/35 group-hover:text-[var(--admin-ink)]/42 transition-colors">
 <div className="w-16 h-16 bg-[var(--admin-ink)]/[0.06] rounded-xl flex items-center justify-center mb-6">
 <Plus size={32} />
 </div>
 <span className="font-bold uppercase tracking-[0.2em] text-[10px]">Select Image File</span>
 </div>
 )}
 </div>

 <div className="flex gap-4">
 <AdminButton
 variant="secondary"
 size="block"
 type="button"
 onClick={() => {
 setIsModalOpen(false);
 resetForm();
 }}
 className="flex-1"
 >
 Cancel
 </AdminButton>
 <AdminButton
 size="block"
 type="submit"
 loading={isSubmitting}
 disabled={!formData.image}
 className="flex-[1.5]"
 >
 {isSubmitting ? submitStep.toUpperCase() + "..." : "Create Look"}
 </AdminButton>
 </div>
 </form>
 </AdminModal>
 )}

 {/* DELETE CONFIRMATION MODAL */}
 {deleteConfirmId && (
 <AdminModal
 onClose={() => setDeleteConfirmId(null)}
 size="sm"
 closeOnScrim={false}
 >
 <div className="text-center">
 <div className="w-20 h-20 bg-[var(--tint-rose-bg)] rounded-xl flex items-center justify-center mx-auto mb-6">
 <AlertTriangle className="text-[var(--tint-rose-fg)]" size={32} strokeWidth={1.5} />
 </div>
 <h3 className="text-xl font-bold mb-3 text-[var(--admin-ink)]">Are you sure?</h3>
 <p className="text-sm text-[var(--admin-ink)]/55 mb-8 leading-relaxed">
 This will permanently remove this look from the website.
 </p>

 <div className="flex flex-col gap-3">
 <AdminButton
 variant="danger"
 size="block"
 onClick={confirmDelete}
 loading={isDeleting}
 >
 Yes, Delete Permanently
 </AdminButton>
 <AdminButton
 variant="secondary"
 size="block"
 onClick={() => setDeleteConfirmId(null)}
 disabled={isDeleting}
 >
 Wait, Go Back
 </AdminButton>
 </div>
 </div>
 </AdminModal>
 )}
 </AdminLayout>
 );
}