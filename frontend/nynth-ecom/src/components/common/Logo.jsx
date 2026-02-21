import React from 'react';
import logo from '../../assets/nynth-logo.png';

export const Logo = ({ className = '', size = 'default' }) => {
    const sizeClasses = {
        sm: 'h-6',
        default: 'h-10',
        lg: 'h-12 md:h-16',
        xl: 'h-16 md:h-24'
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
