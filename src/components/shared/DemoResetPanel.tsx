import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoContext } from '../../contexts/DemoContext';
// No preset demo request - clean slate demo
import { 
  RefreshCw, 
  Play, 
  Users, 
  Vote, 
  FileText, 
  RotateCcw,
  X,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface DemoResetPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

const DemoResetPanel: React.FC<DemoResetPanelProps> = ({ isVisible, onClose }) => {
  const { switchRole } = useAuth();
  const { resetDemo, addNotification, setRequestsDirectly, setNotificationsDirectly } = useDemoContext();
  const [isResetting, setIsResetting] = useState(false);
  const [lastReset, setLastReset] = useState<string | null>(null);

  if (!isVisible) return null;

  const demoScenarios = [
    {
      id: 'fresh-start',
      name: 'Clean Slate Demo',
      description: 'Start fresh with no requests - ready for live demo workflow',
      icon: <RotateCcw className="w-5 h-5" />,
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      data: {
        requests: [],
        notifications: []
      }
    }
  ];

  const handleResetDemo = async (scenario: typeof demoScenarios[0]) => {
    setIsResetting(true);
    
    try {
      // Clear existing data
      resetDemo();
      
      // Wait a moment for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set up scenario data
      setRequestsDirectly(scenario.data.requests);
      
      // Add notifications with timestamps
      const timestampedNotifications = scenario.data.notifications.map(notification => {
        const timestamp = new Date().toLocaleTimeString();
        return `${timestamp}: ${notification}`;
      });
      setNotificationsDirectly(timestampedNotifications);
      
      // Reset to Jason as default user for most scenarios
      if (scenario.id !== 'board-voting-demo') {
        switchRole('jason-abustan');
      } else {
        // For board voting demo, start with board member
        switchRole('robert-ferguson');
      }
      
      setLastReset(scenario.name);
      
      // Success feedback
      addNotification(`✅ Demo reset to: ${scenario.name}`);
      
      // Auto-close panel after successful reset
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Demo reset failed:', error);
      addNotification(`❌ Demo reset failed. Please try again.`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleQuickReset = () => {
    // Quick reset to fresh start
    handleResetDemo(demoScenarios[0]);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Demo Reset Panel</h2>
              <p className="text-sm text-gray-600">Choose a scenario for your presentation</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {lastReset && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Last: {lastReset}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Quick Actions */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-900">Demo Reset Panel</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Choose a scenario to reset the demo for your presentation.
                </p>
                <button
                  onClick={handleQuickReset}
                  disabled={isResetting}
                  className="mt-2 btn-secondary text-sm"
                >
                  {isResetting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Quick Reset (Fresh Start)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Demo Scenarios */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Demo Scenario</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demoScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${scenario.color} hover:scale-[1.02]`}
                  onClick={() => handleResetDemo(scenario)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 p-2 bg-white rounded-lg">
                      {scenario.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{scenario.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
                      
                      {/* Scenario Details */}
                      <div className="mt-3 space-y-1">
                        <div className="text-xs text-gray-500">
                          <strong>Requests:</strong> {scenario.data.requests.length}
                        </div>
                        <div className="text-xs text-gray-500">
                          <strong>Notifications:</strong> {scenario.data.notifications.length}
                        </div>
                        {scenario.id === 'board-voting-demo' && (
                          <div className="text-xs text-purple-600 font-medium">
                            Starts with Robert Ferguson (Board President)
                          </div>
                        )}
                        {scenario.id !== 'board-voting-demo' && (
                          <div className="text-xs text-blue-600 font-medium">
                            Starts with Jason Abustan (Homeowner)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Keyboard Shortcuts</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div><kbd className="px-2 py-1 bg-white rounded text-xs">Ctrl+Shift+R</kbd> - Open Reset Panel</div>
              <div><kbd className="px-2 py-1 bg-white rounded text-xs">Ctrl+Shift+D</kbd> - Toggle Debug Panel</div>
              <div><kbd className="px-2 py-1 bg-white rounded text-xs">Ctrl+Shift+P</kbd> - Toggle Presentation Mode</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoResetPanel;
