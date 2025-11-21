'use client';

interface MicrophoneStatusProps {
  isActive: boolean;
}

export function MicrophoneStatus({ isActive }: MicrophoneStatusProps) {
  return (
    <div className="mic-status">
      <div className={`mic-indicator ${isActive ? 'active' : 'inactive'}`}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"
            fill="currentColor"
          />
          <path
            d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10H3V12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12V10H19Z"
            fill="currentColor"
          />
          <path d="M11 22H13V24H11V22Z" fill="currentColor" />
        </svg>
      </div>
      <span className="mic-text">
        Microphone: {isActive ? 'Active' : 'Inactive'}
      </span>

      <style jsx>{`
        .mic-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin: 16px 0;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .mic-indicator {
          display: flex;
          align-items: center;
          transition: color 0.3s;
        }

        .mic-indicator.active {
          color: #10b981;
          animation: pulse 1.5s infinite;
        }

        .mic-indicator.inactive {
          color: #9ca3af;
        }

        .mic-text {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}

