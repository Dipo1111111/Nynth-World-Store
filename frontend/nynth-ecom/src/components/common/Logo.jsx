import React from 'react';
import logo from '../../assets/nynth-logo.png';

export const Logo = ({ className = '', size = 'default' }) => {
    const sizeClasses = {
        sm: 'h-6',
        default: 'h-8',
        lg: 'h-10',
        xl: 'h-12'
    };

    return (
        <img
            src={logo}
            alt="NYNTH"
            className={`${sizeClasses[size] || sizeClasses.default} ${className}`}
        />
    );
};

export default Logo;
