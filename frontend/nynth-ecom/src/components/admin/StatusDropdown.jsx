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
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-900 border-yellow-200'
    },
    packaging: {
        label: 'Packaging',
        className: 'bg-blue-100 text-blue-900 border-blue-200'
    },
    shipped: {
        label: 'Shipped',
        className: 'bg-purple-100 text-purple-900 border-purple-200'
    },
    delivered: {
        label: 'Delivered',
        className: 'bg-green-100 text-green-900 border-green-200'
    },
    cancelled: {
        label: 'Cancelled',
        className: 'bg-red-100 text-red-900 border-red-200'
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
                className={`rounded-full border px-4 py-1 text-xs font-medium ${currentConfig.className} hover:opacity-80 transition-opacity w-auto min-w-[120px]`}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${config.className.split(' ')[0]}`} />
                            {config.label}
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export default StatusDropdown;
