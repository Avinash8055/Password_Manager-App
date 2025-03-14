import React, { useEffect } from 'react';

const Splash: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1000); // 1000ms = one second

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <h1 className="text-9xl font-black text-white tracking-widest drop-shadow-2xl">
        CCP
      </h1>
    </div>
  );
};

export default Splash;