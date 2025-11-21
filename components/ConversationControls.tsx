'use client';

type ConnectionState = 'disconnected' | 'connecting' | 'connected';

interface ConversationControlsProps {
  connectionState: ConnectionState;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConversationControls({
  connectionState,
  onConnect,
  onDisconnect,
}: ConversationControlsProps) {
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  return (
    <div className="controls">
      {!isConnected ? (
        <button
          className="btn btn-primary"
          onClick={onConnect}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Start Conversation'}
        </button>
      ) : (
        <button className="btn btn-danger" onClick={onDisconnect}>
          End Conversation
        </button>
      )}

      <style jsx>{`
        .controls {
          display: flex;
          justify-content: center;
          margin-top: 24px;
        }

        .btn {
          padding: 14px 32px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 200px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(239, 68, 68, 0.4);
        }
      `}</style>
    </div>
  );
}

