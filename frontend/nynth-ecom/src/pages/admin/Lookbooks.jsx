import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { fetchLookbooks, uploadImage } from "../../api/firebaseFunctions";
import { db } from "../../api/firebase";
import { collection, addDoc, deleteDoc, doc, serverTimestamp, onSnapshot, getDocs } from "firebase/firestore";
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
            const snapshot = await getDocs(collection(db, "lookbooks"));
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            data.sort((a, b) => {
                const dateA = a.created_at?.seconds || 0;
                const dateB = b.created_at?.seconds || 0;
                return dateB - dateA;
            });
            
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
        const q = collection(db, "lookbooks");
        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                data.sort((a, b) => {
                    const dateA = a.created_at?.seconds || 0;
                    const dateB = b.created_at?.seconds || 0;
                    return dateB - dateA;
                });
                setLookbooks(data);
                setLoading(false);
            },
            (error) => {
                console.error("Firestore Sync Error (Lookbooks):", error);
                if (error.code === 'permission-denied' || error.code === 'failed-precondition') {
                    loadLookbooks();
                } else {
                    toast.error("Real-time sync failed.");
                    setLoading(false);
                }
            }
        );
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
            await addDoc(collection(db, "lookbooks"), {
                image: finalImageUrl,
                created_at: serverTimestamp()
            });

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
            await deleteDoc(doc(db, "lookbooks", deleteConfirmId));
            toast.success("Look deleted");
            setDeleteConfirmId(null);
        } catch (error) {
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
                    <h2 className="text-2xl font-bold font-space">Gallery</h2>
                    <p className="text-gray-400 text-sm">Manage your editorial imagery.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => loadLookbooks(true)}
                        className="px-5 py-2.5 border border-gray-200 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center gap-2 px-6 py-2.5 shadow-lg shadow-black/10 active:scale-95"
                    >
                        <Plus size={18} />
                        <span className="text-[11px] tracking-widest font-bold uppercase">Add New Look</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-24">
                    <Loader2 className="animate-spin text-black/10" size={48} strokeWidth={1.5} />
                </div>
            ) : lookbooks.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                        <Upload className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Looks Found</h3>
                    <p className="text-gray-400 text-sm mb-8">Start by adding your first visual to the collection.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center gap-3 px-8 py-4"
                    >
                        <Plus size={18} />
                        <span className="text-xs tracking-widest font-bold uppercase">Add First Look</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
                    {lookbooks.map((look) => (
                        <div key={look.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 relative group aspect-[3/4]">
                            <img src={look.image} alt="" className="w-full h-full object-cover" />
                            
                            {/* Persistent Delete Button for Mobile/Desktop Accessibility */}
                            <button
                                onClick={() => setDeleteConfirmId(look.id)}
                                className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-red-500 p-2.5 rounded-full shadow-lg hover:bg-white hover:scale-110 active:scale-90 transition-all duration-300 z-10"
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
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsModalOpen(false);
                            resetForm();
                        }
                    }}
                >
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold font-space">Upload Visual</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center cursor-pointer hover:border-black/20 hover:bg-gray-50/50 transition-all relative group">
                                <input
                                    type="file"
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                />
                                {formData.image ? (
                                    <div className="flex flex-col items-center gap-4 text-green-600">
                                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                                            <CheckCircle size={32} />
                                        </div>
                                        <span className="text-sm font-bold uppercase tracking-widest">{formData.image.name}</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-300 group-hover:text-gray-400 transition-colors">
                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
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
                                    className="flex-1 py-4 border border-gray-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !formData.image}
                                    className="flex-[1.5] py-4 bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black/90 disabled:opacity-20 transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={14} />
                                            <span>{submitStep.toUpperCase()}...</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 text-center shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <AlertTriangle className="text-red-500" size={32} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 font-space">Are you sure?</h3>
                        <p className="text-gray-400 text-sm mb-10 leading-relaxed uppercase tracking-widest font-bold text-[9px]">
                            This will permanently remove this look from the website.
                        </p>
                        
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="w-full py-4 bg-red-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? <Loader2 className="animate-spin" size={14} /> : "Yes, Delete Permanently"}
                            </button>
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                disabled={isDeleting}
                                className="w-full py-4 bg-gray-50 text-black border border-gray-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95"
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
