import React from 'react';
import Image from 'next/image';
import { Card } from './ui/card';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showLogo?: boolean;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title, 
  showLogo = true, 
  className = "" 
}) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 ${className}`}>
      {/* Header */}
      {showLogo && (
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center space-x-4">
              <Image
                src="/assets/images/AMA-Logo.png"
                alt="AMA Computer College"
                width={80}
                height={80}
                className="object-contain"
              />
              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-red-700">
                  AMA Computer College
                </h1>
                <p className="text-sm md:text-base text-blue-600 font-medium">
                  Interactive Quiz System
                </p>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {title && (
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              {title}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-blue-500 mx-auto rounded-full"></div>
          </div>
        )}
        
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Image
              src="/assets/images/AMA-Senior-High-logo.png"
              alt="AMA Senior High"
              width={40}
              height={40}
              className="object-contain"
            />
            <p className="text-sm">
              © 2024 AMA Computer College. All rights reserved.
            </p>
          </div>
          <p className="text-xs text-gray-400">
            Empowering minds through interactive learning
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;