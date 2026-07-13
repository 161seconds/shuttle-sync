import React from 'react';
import { motion } from 'framer-motion';

interface ScrollRevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    distance?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({ 
    children, 
    className = '', 
    delay = 0,
    direction = 'up',
    distance = 20
}) => {
    const getInitialY = () => {
        if (direction === 'up') return distance;
        if (direction === 'down') return -distance;
        return 0;
    };

    const getInitialX = () => {
        if (direction === 'left') return distance;
        if (direction === 'right') return -distance;
        return 0;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: getInitialY(), x: getInitialX() }}
            whileInView={{ opacity: 1, y: 0, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }} // ease-out-quint
            className={className}
        >
            {children}
        </motion.div>
    );
};
