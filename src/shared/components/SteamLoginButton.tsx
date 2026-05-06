'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const SteamLoginButton = () => {
  const handleLogin = () => {
    window.location.href = 'https://9q88kt3s-3001.brs.devtunnels.ms/api/auth/steam';
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleLogin}
      className="group relative flex items-center gap-3 overflow-hidden rounded-[4px] bg-card px-6 py-2.5 font-medium text-white transition-all duration-300 border border-accent/30 hover:border-accent shadow-lg hover:shadow-[0_0_20px_rgba(217,70,239,0.4)]"
    >
      {/* Subtle background glow on hover inside the button */}
      <div className="absolute inset-0 bg-accent/0 transition-colors duration-300 group-hover:bg-accent/10" />
      
      {/* Shine effect */}
      <div className="absolute -left-full top-0 h-full w-1/2 skew-x-[-25deg] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-500 group-hover:left-[150%]" />

      <svg 
        viewBox="0 0 24 24" 
        className="relative z-10 h-5 w-5 fill-current text-white/70 transition-colors duration-300 group-hover:text-white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 .002C5.372.002 0 5.374 0 12c0 1.034.133 2.036.381 2.991l5.483 2.27c.224-.134.484-.216.761-.216.14 0 .272.023.398.061l2.508-3.66a3.11 3.11 0 0 1-.035-3.136c.038-.07.078-.139.123-.205.81-1.18 2.39-1.488 3.528-.688 1.139.8 1.436 2.36.626 3.539-.374.545-.929.89-1.54.996l-1.077 4.195c.002.016.006.03.006.046 0 1.258-1.018 2.278-2.275 2.278-.293 0-.57-.058-.823-.16L2.35 20.916C4.832 22.84 7.95 24 11.34 24 18.332 24 24 18.332 24 11.34S18.332-.002 11.34-.002h.66zm-.92 14.507c.803 0 1.453.651 1.453 1.454a1.454 1.454 0 1 1-1.453-1.454zm1.378-4.577a1.64 1.64 0 1 0-3.279.002 1.64 1.64 0 0 0 3.279-.002z" />
      </svg>
      
      <span className="relative z-10 text-[10px] tracking-[0.2em] uppercase font-black">
        Iniciar sesión con Steam
      </span>
    </motion.button>
  );
};
