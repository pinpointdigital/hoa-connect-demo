import React, { useState, useEffect } from 'react';
import { Bug, ChevronDown, ChevronUp, X, Trash2, Download } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';

interface DebugLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
  const [isMinimized, setIsMinimized] = useState(false);
  const { socket, connectionStatus } = useSocket();

  useEffect(() => {
    // Add initial connection log
    addLog('info', `Socket connection status: ${connectionStatus}`);
  }, [connectionStatus]);

  useEffect(() => {
    if (socket) {
      // Listen for socket events for debugging
      const handleAnyEvent = (eventName: string, ...args: any[]) => {
        addLog('debug', `Socket event: ${eventName}`, args);
      };

      socket.onAny(handleAnyEvent);

      return () => {
        socket.offAny(handleAnyEvent);
      };
    }
  }, [socket]);

  const addLog = (level: DebugLog['level'], message: string, data?: any) => {
    const newLog: DebugLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      level,
      message,
      data
    };

    setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep only last 100 logs
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()}: ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`
    ).join('\n\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => filter === 'all' || log.level === filter);

  const getLevelColor = (level: DebugLog['level']) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'debug': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bug className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Debug Panel</span>
          <span className="text-xs text-gray-500">({filteredLogs.length} logs)</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Controls */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Logs</option>
                <option value="error">Errors</option>
                <option value="warn">Warnings</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
              <div className="flex space-x-1">
                <button
                  onClick={exportLogs}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Export logs"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={clearLogs}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Clear logs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Socket: <span className={connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}>
                {connectionStatus}
              </span>
            </div>
          </div>

          {/* Logs */}
          <div className="h-64 overflow-y-auto p-2 space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                No logs to display
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="text-xs border-l-2 border-gray-200 pl-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-1 py-0.5 rounded text-xs ${getLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-gray-400">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="mt-1 text-gray-700">{log.message}</div>
                  {log.data && (
                    <div className="mt-1 p-1 bg-gray-100 rounded text-gray-600 font-mono text-xs overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DebugPanel;


