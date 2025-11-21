'use client';

type ConnectionState = 'disconnected' | 'connecting' | 'connected';

interface ConnectionStatusProps {
  state: ConnectionState;
}

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  const getStatusColor = () => {
    switch (state) {
      case 'connected':
        return '#10b981'; // green
      case 'connecting':
        return '#f59e0b'; // amber
      case 'disconnected':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusText = () => {
    switch (state) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="connection-status">
      <div className="status-indicator" style={{ backgroundColor: getStatusColor() }} />
      <span className="status-text">{getStatusText()}</span>
      <style jsx>{`
        .connection-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 24px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .status-text {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

