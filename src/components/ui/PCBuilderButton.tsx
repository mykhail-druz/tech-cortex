'use client';

import Link from 'next/link';
import { FaDesktop } from 'react-icons/fa';

interface PCBuilderButtonProps {
  variant?: 'desktop' | 'mobile';
  onClick?: () => void;
  className?: string;
}

export default function PCBuilderButton({ 
  variant = 'desktop', 
  onClick,
  className = '' 
}: PCBuilderButtonProps) {
  if (variant === 'mobile') {
    return (
      <Link
        href="/pc-builder"
        className={`block py-2 text-gray-600 hover:text-primary font-medium ${className}`}
        onClick={onClick}
      >
        <span className="flex items-center">
          <FaDesktop className="h-5 w-5 mr-3 text-primary" />
          PC Builder
        </span>
      </Link>
    );
  }

  // Desktop variant with all animations and effects
  return (
    <Link
      href="/pc-builder"
      className={`hidden md:flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-full text-sm font-semibold hover:from-blue-500 hover:to-purple-500 transition-all duration-300 transform hover:shadow-xl group relative overflow-hidden active:scale-95 ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center relative z-10">
        <FaDesktop className="h-4 w-4 mr-2 transform transition-transform" />
        <span className="relative">PC Builder</span>
      </div>

      {/* Постоянное базовое свечение */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full blur opacity-40 group-hover:opacity-80 transition-opacity duration-300 -z-10"></div>

      {/* Постоянные мерцающие искры по углам - всегда активны */}
      <div className="absolute -top-1 -left-1 w-2 h-2 bg-cyan-300 rounded-full opacity-60 group-hover:opacity-100 transition-all duration-300 animate-ping"></div>
      <div
        className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-300 rounded-full opacity-60 group-hover:opacity-100 transition-all duration-500 animate-ping"
        style={{ animationDelay: '0.3s' }}
      ></div>
      <div
        className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-300 rounded-full opacity-60 group-hover:opacity-100 transition-all duration-700 animate-ping"
        style={{ animationDelay: '0.6s' }}
      ></div>
      <div
        className="absolute -bottom-1 -right-1 w-2 h-2 bg-cyan-300 rounded-full opacity-60 group-hover:opacity-100 transition-all duration-900 animate-ping"
        style={{ animationDelay: '0.9s' }}
      ></div>

      {/* Постоянные летящие искры вокруг кнопки */}
      <div className="absolute top-1/2 -left-3 w-1 h-1 bg-blue-300 rounded-full opacity-50 group-hover:opacity-100 transition-all duration-300 animate-pulse"></div>
      <div
        className="absolute top-1/4 -right-3 w-1 h-1 bg-sky-900 rounded-full opacity-50 group-hover:opacity-100 transition-all duration-400 animate-pulse"
        style={{ animationDelay: '0.2s' }}
      ></div>
      <div
        className="absolute bottom-1/4 -left-3 w-1 h-1 bg-cyan-300 rounded-full opacity-50 group-hover:opacity-100 transition-all duration-500 animate-pulse"
        style={{ animationDelay: '0.4s' }}
      ></div>
      <div
        className="absolute bottom-1/2 -right-3 w-1 h-1 bg-indigo-300 rounded-full opacity-50 group-hover:opacity-100 transition-all duration-600 animate-pulse"
        style={{ animationDelay: '0.6s' }}
      ></div>

      {/* Дополнительные мелкие искры */}
      <div
        className="absolute top-0 left-1/4 w-0.5 h-0.5 bg-white rounded-full opacity-40 group-hover:opacity-80 animate-ping transition-opacity duration-300"
        style={{ animationDelay: '0.1s' }}
      ></div>
      <div
        className="absolute bottom-0 right-1/4 w-0.5 h-0.5 bg-white rounded-full opacity-40 group-hover:opacity-80 animate-ping transition-opacity duration-400"
        style={{ animationDelay: '0.4s' }}
      ></div>
      <div
        className="absolute top-1/2 left-0 w-0.5 h-0.5 bg-cyan-200 rounded-full opacity-40 group-hover:opacity-80 animate-ping transition-opacity duration-500"
        style={{ animationDelay: '0.7s' }}
      ></div>
      <div
        className="absolute top-1/2 right-0 w-0.5 h-0.5 bg-purple-200 rounded-full opacity-40 group-hover:opacity-80 animate-ping transition-opacity duration-600"
        style={{ animationDelay: '1s' }}
      ></div>

      {/* Волновые эффекты - постоянные */}
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50 group-hover:opacity-100 transition-all duration-2000 transform -translate-x-full animate-pulse"
        style={{ animationDuration: '3s' }}
      ></div>

      {/* Основное свечение с корпоративными цветами */}
      <div
        className="absolute -inset-2 bg-gradient-to-r from-blue-400/30 via-cyan-400/30 to-purple-400/30 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-500 -z-20 animate-pulse"
        style={{ animationDuration: '2s' }}
      ></div>
      <div
        className="absolute -inset-3 bg-gradient-to-r from-indigo-400/20 via-blue-400/20 to-purple-500/20 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-700 -z-30 animate-pulse"
        style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}
      ></div>

      {/* Падающие частицы - усиливаются при ховере */}
      <div
        className="absolute top-1/2 left-1/2 w-1 h-1 bg-cyan-400 rounded-full opacity-40 group-hover:opacity-100 transition-all duration-1000 transform -translate-x-6 -translate-y-6 group-hover:-translate-x-8 group-hover:-translate-y-8 animate-bounce"
        style={{ animationDelay: '0s', animationDuration: '2s' }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 w-1 h-1 bg-blue-400 rounded-full opacity-40 group-hover:opacity-100 transition-all duration-1200 transform translate-x-6 -translate-y-6 group-hover:translate-x-8 group-hover:-translate-y-8 animate-bounce"
        style={{ animationDelay: '0.2s', animationDuration: '2.2s' }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 w-1 h-1 bg-purple-400 rounded-full opacity-40 group-hover:opacity-100 transition-all duration-1400 transform -translate-x-6 translate-y-6 group-hover:-translate-x-8 group-hover:translate-y-8 animate-bounce"
        style={{ animationDelay: '0.4s', animationDuration: '2.4s' }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 w-1 h-1 bg-indigo-400 rounded-full opacity-40 group-hover:opacity-100 transition-all duration-1600 transform translate-x-6 translate-y-6 group-hover:translate-x-8 group-hover:translate-y-8 animate-bounce"
        style={{ animationDelay: '0.6s', animationDuration: '2.6s' }}
      ></div>

      {/* Shimmer эффект - постоянный */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-60 transition-all duration-1500 transform -skew-x-12 -translate-x-full group-hover:translate-x-full"></div>

      {/* Взрывной эффект при клике */}
      <div className="absolute inset-0 rounded-full bg-cyan-400/50 opacity-0 group-active:opacity-80 transition-all duration-150 transform scale-0 group-active:scale-150"></div>

      {/* Дополнительные микро-искры на поверхности кнопки */}
      <div
        className="absolute top-2 left-8 w-0.5 h-0.5 bg-cyan-100 rounded-full opacity-30 group-hover:opacity-70 animate-ping transition-opacity duration-300"
        style={{ animationDelay: '0.3s' }}
      ></div>
      <div
        className="absolute bottom-3 right-10 w-0.5 h-0.5 bg-purple-100 rounded-full opacity-30 group-hover:opacity-70 animate-ping transition-opacity duration-400"
        style={{ animationDelay: '0.6s' }}
      ></div>
      <div
        className="absolute top-3 right-6 w-0.5 h-0.5 bg-blue-100 rounded-full opacity-30 group-hover:opacity-70 animate-ping transition-opacity duration-500"
        style={{ animationDelay: '0.9s' }}
      ></div>
      <div
        className="absolute bottom-2 left-12 w-0.5 h-0.5 bg-indigo-100 rounded-full opacity-30 group-hover:opacity-70 animate-ping transition-opacity duration-600"
        style={{ animationDelay: '1.2s' }}
      ></div>

      {/* Орбитальные частицы */}
      <div
        className="absolute top-1/2 left-1/2 w-1 h-1 bg-cyan-300 rounded-full opacity-50 group-hover:opacity-100 transition-all duration-2000 transform -translate-x-1/2 -translate-y-1/2 animate-spin"
        style={{
          animationDuration: '3s',
          transform: 'translate(-50%, -50%) rotate(0deg) translateX(20px) rotate(0deg)',
        }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-orange-900 rounded-full opacity-50 group-hover:opacity-100 transition-all duration-2000 transform -translate-x-1/2 -translate-y-1/2 animate-spin"
        style={{
          animationDuration: '4s',
          animationDirection: 'reverse',
          transform: 'translate(-50%, -50%) rotate(0deg) translateX(25px) rotate(0deg)',
        }}
      ></div>
    </Link>
  );
}