"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/Icon";

const Banner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    hours: 6,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetTime = new Date();
    targetTime.setHours(targetTime.getHours() + 6);

    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetTime.getTime() - now.getTime();

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white overflow-hidden" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 sm:py-3">
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <Icon name="flash" className="size-5 text-yellow-300 animate-pulse" fill="currentColor" />
              <span className="text-sm sm:text-base font-bold text-yellow-100">
                عرض محدود!
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium">
                اشري 10 حوايج والـ11 بلاش <Icon name="gift" className="size-4" fill="currentColor" />
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Icon name="clock" className="size-4 hidden sm:block" fill="currentColor" />
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full">
                <div className="flex items-center gap-0.5">
                  <span className="text-xs sm:text-sm font-bold min-w-[1.2rem] text-center">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-xs">:</span>
                  <span className="text-xs sm:text-sm font-bold min-w-[1.2rem] text-center">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-xs">:</span>
                  <span className="text-xs sm:text-sm font-bold min-w-[1.2rem] text-center">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors mr-2"
            aria-label="أغلق"
          >
            <Icon name="close-think" className="size-4" fill="currentColor" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-yellow-300 transition-all duration-1000 ease-linear "
          style={{ 
            width: `${100 - ((timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds) / (6 * 3600)) * 100}%` 
          }}
        />
      </div>
    </div>
  );
};

export default Banner;
