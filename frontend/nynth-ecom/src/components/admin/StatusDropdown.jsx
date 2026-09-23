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
        className: 'bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)] border-[var(--tint-amber-line)]'
    },
    packaging: {
        label: 'In Packaging',
        className: 'bg-[var(--tint-violet-bg)] text-[var(--tint-violet-fg)] border-[var(--tint-violet-line)]'
    },
    shipped: {
        label: 'En Route / Shipped',
        className: 'bg-[var(--tint-sky-bg)] text-[var(--tint-sky-fg)] border-[var(--tint-sky-line)]'
    },
    delivered: {
        label: 'Delivered',
        className: 'bg-[var(--tint-emerald-bg)] text-[var(--tint-emerald-fg)] border-[var(--tint-emerald-line)]'
    },
    cancelled: {
        label: 'Cancelled',
        className: 'bg-[var(--tint-slate-bg)] text-[var(--tint-slate-fg)] border-[var(--tint-slate-line)]'
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
