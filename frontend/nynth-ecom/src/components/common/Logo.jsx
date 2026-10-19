import React from 'react';
import logo from '../../assets/nynth-logo.png';

// The wordmark PNG ships white on transparent. The colour it reads as is a
// CSS decision, not a prop, because the same PNG has to be white on the black
// admin rail and black on paper everywhere else. See .nynth-wordmark in
// src/index.css.
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
            className={`${sizeClasses[size] || sizeClasses.default} ${className} nynth-wordmark`}
        />
    );
};

export default Logo;
