import React, { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { updateOrderStatus } from '../../api/firebaseFunctions';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
    pending: {
        label: 'Order Pending',
        className: 'bg-amber-50 text-amber-700 border-amber-100'
    },
    packaging: {
        label: 'In Packaging',
        className: 'bg-violet-50 text-violet-700 border-violet-100'
    },
    shipped: {
        label: 'En Route / Shipped',
        className: 'bg-sky-50 text-sky-700 border-sky-100'
    },
    delivered: {
        label: 'Delivered',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    cancelled: {
        label: 'Cancelled',
        className: 'bg-slate-100 text-slate-500 border-slate-200'
    }
};

export const StatusDropdown = ({ orderId, currentStatus, onStatusChange }) => {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusChange = async (newStatus) => {
        if (newStatus === currentStatus) return;

        setIsUpdating(true);
        try {
            const success = await updateOrderStatus(orderId, newStatus);
            if (success) {
                toast.success(`Order status updated to ${STATUS_CONFIG[newStatus].label}`);
                if (onStatusChange) {
                    onStatusChange(newStatus);
                }
            } else {
                toast.error('Failed to update status');
            }
        } catch (error) {
            console.error('Status update error:', error);
            toast.error('Failed to update status');
        } finally {
            setIsUpdating(false);
        }
    };

    const currentConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;

    return (
        <Select
            value={currentStatus}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
        >
            <SelectTrigger
                className={`rounded-lg border px-4 py-1 text-xs font-medium ${currentConfig.className} hover:opacity-80 transition-opacity w-auto min-w-[120px]`}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-lg ${config.className.split(' ')[0]}`} />
                            {config.label}
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export default StatusDropdown;
