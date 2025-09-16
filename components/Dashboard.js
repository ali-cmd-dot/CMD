import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area, AreaChart
} from 'recharts';
import { AlertTriangle, Clock, TrendingUp, Users, Activity, Target } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sheets');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (hours) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
    return `${Math.round(hours / 24 * 10) / 10}d`;
  };

  const prepareMonthlyData = (monthlyBreakdown) => {
    return Object.entries(monthlyBreakdown || {})
      .map(([month, count]) => ({
        month: month,
        count: count,
        monthName: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const prepareClientData = (clientBreakdown) => {
    const allClients = new Set();
    Object.values(clientBreakdown || {}).forEach(monthData => {
      Object.keys(monthData).forEach(client => allClients.add(client));
    });

    return Object.entries(clientBreakdown || {})
      .map(([month, clients]) => ({
        month: month,
        monthName: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        ...clients
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4 text-xl">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-2xl mb-2">Error Loading Data</h2>
          <p>{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-300">Last updated: {new Date(data.lastUpdated).toLocaleString()}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <AlertTriangle className="h-10 w-10 text-yellow-400" />
              <div className="ml-4">
                <p className="text-gray-300">Total Alerts</p>
                <p className="text-3xl font-bold text-white">{data.alertTracking.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <Target className="h-10 w-10 text-red-400" />
              <div className="ml-4">
                <p className="text-gray-300">Misalignments</p>
                <p className="text-3xl font-bold text-white">{data.misalignmentTracking.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <Activity className="h-10 w-10 text-green-400" />
              <div className="ml-4">
                <p className="text-gray-300">Video Requests</p>
                <p className="text-3xl font-bold text-white">{data.historicalVideoRequests.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <Clock className="h-10 w-10 text-blue-400" />
              <div className="ml-4">
                <p className="text-gray-300">Avg Resolution</p>
                <p className="text-3xl font-bold text-white">
                  {formatTime(data.historicalVideoRequests.resolutionStats.median)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Tracking Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <AlertTriangle className="mr-2" /> Alert Tracking Analysis
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Monthly Alert Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={prepareMonthlyData(data.alertTracking.monthlyBreakdown)}>
                  <CartesianGrid strokeDasharray="3,3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="monthName" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }} />
                  <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Client-wise Alert Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prepareClientData(data.alertTracking.clientBreakdown)}>
                  <CartesianGrid strokeDasharray="3,3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="monthName" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }} />
                  <Legend />
                  {Object.keys(data.alertTracking.clientBreakdown).length > 0 && 
                   Object.keys(Object.values(data.alertTracking.clientBreakdown)[0] || {}).map((client, index) => (
                    <Bar key={client} dataKey={client} fill={COLORS[index % COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Misalignment Tracking Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Target className="mr-2" /> Misalignment Tracking Analysis
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Monthly Misalignment Counts</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={prepareMonthlyData(data.misalignmentTracking.monthlyBreakdown)}>
                  <CartesianGrid strokeDasharray="3,3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="monthName" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }} />
                  <Line type="monotone" dataKey="count" stroke="#ff7300" strokeWidth={3} dot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Client-wise Misalignment Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prepareClientData(data.misalignmentTracking.clientBreakdown)}>
                  <CartesianGrid strokeDasharray="3,3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="monthName" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }} />
                  <Legend />
                  {Object.keys(data.misalignmentTracking.clientBreakdown).length > 0 && 
                   Object.keys(Object.values(data.misalignmentTracking.clientBreakdown)[0] || {}).map((client, index) => (
                    <Bar key={client} dataKey={client} fill={COLORS[index % COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Historical Video Requests Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Activity className="mr-2" /> Historical Video Requests Analysis
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Resolution Time Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Minimum:</span>
                  <span className="text-green-400 font-bold">{formatTime(data.historicalVideoRequests.resolutionStats.min)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Median:</span>
                  <span className="text-yellow-400 font-bold">{formatTime(data.historicalVideoRequests.resolutionStats.median)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Maximum:</span>
                  <span className="text-red-400 font-bold">{formatTime(data.historicalVideoRequests.resolutionStats.max)}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Monthly Video Request Trends</h3>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={prepareMonthlyData(data.historicalVideoRequests.monthlyBreakdown)}>
                  <CartesianGrid strokeDasharray="3,3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="monthName" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }} />
                  <Bar dataKey="count" fill="#82ca9d" />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* All Issues Analysis Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <TrendingUp className="mr-2" /> Complete Issues Analysis
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Issues Raised vs Closed</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={Object.keys({...data.allIssues.monthlyRaised, ...data.allIssues.monthlyClosed}).sort().map(month => ({
                  month,
                  monthName: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                  raised: data.allIssues.monthlyRaised[month] || 0,
                  closed: data.allIssues.monthlyClosed[month] || 0
                }))}>
                  <CartesianGrid strokeDasharray="3,3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="monthName" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }} />
                  <Legend />
                  <Bar dataKey="raised" fill="#ff7300" name="Issues Raised" />
                  <Bar dataKey="closed" fill="#82ca9d" name="Issues Closed" />
                  <Line type="monotone" dataKey="raised" stroke="#ff7300" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Resolution Time Distribution</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-gray-300 text-sm">Fastest</p>
                  <p className="text-2xl font-bold text-green-400">{formatTime(data.allIssues.resolutionStats.min)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-300 text-sm">Average</p>
                  <p className="text-2xl font-bold text-yellow-400">{formatTime(data.allIssues.resolutionStats.median)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-300 text-sm">Slowest</p>
                  <p className="text-2xl font-bold text-red-400">{formatTime(data.allIssues.resolutionStats.max)}</p>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Total Issues Raised:</span>
                  <span className="text-orange-400 font-bold">{data.allIssues.totalRaised}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Total Issues Closed:</span>
                  <span className="text-green-400 font-bold">{data.allIssues.totalClosed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Resolution Rate:</span>
                  <span className="text-blue-400 font-bold">
                    {data.allIssues.totalRaised > 0 ? 
                      Math.round((data.allIssues.totalClosed / data.allIssues.totalRaised) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Client-wise breakdown for all issues */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Client-wise Issue Distribution Over Time</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={prepareClientData(data.allIssues.clientBreakdown)}>
                <CartesianGrid strokeDasharray="3,3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="monthName" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none' }} />
                <Legend />
                {Object.keys(data.allIssues.clientBreakdown).length > 0 && 
                 Object.keys(Object.values(data.allIssues.clientBreakdown)[0] || {}).map((client, index) => (
                  <Bar key={client} dataKey={client} fill={COLORS[index % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Users className="mr-2" /> Executive Summary
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <h4 className="text-lg font-semibold text-white mb-2">Alert Performance</h4>
              <p className="text-3xl font-bold text-yellow-400 mb-1">{data.alertTracking.total}</p>
              <p className="text-gray-300 text-sm">Total Alerts Processed</p>
              <p className="text-gray-400 text-xs mt-2">
                Across {Object.keys(data.alertTracking.monthlyBreakdown).length} months
              </p>
            </div>
            
            <div className="text-center">
              <h4 className="text-lg font-semibold text-white mb-2">System Alignment</h4>
              <p className="text-3xl font-bold text-red-400 mb-1">{data.misalignmentTracking.total}</p>
              <p className="text-gray-300 text-sm">Misalignment Events</p>
              <p className="text-gray-400 text-xs mt-2">
                Peak month: {Object.entries(data.misalignmentTracking.monthlyBreakdown).reduce((a, b) => 
                  (a[1] > b[1]) ? a : b, ['', 0])[1]} events
              </p>
            </div>
            
            <div className="text-center">
              <h4 className="text-lg font-semibold text-white mb-2">Video Requests</h4>
              <p className="text-3xl font-bold text-green-400 mb-1">{data.historicalVideoRequests.total}</p>
              <p className="text-gray-300 text-sm">Historical Requests</p>
              <p className="text-gray-400 text-xs mt-2">
                Avg: {formatTime(data.historicalVideoRequests.resolutionStats.median)} resolution
              </p>
            </div>
            
            <div className="text-center">
              <h4 className="text-lg font-semibold text-white mb-2">Overall Efficiency</h4>
              <p className="text-3xl font-bold text-blue-400 mb-1">
                {data.allIssues.totalRaised > 0 ? 
                  Math.round((data.allIssues.totalClosed / data.allIssues.totalRaised) * 100) : 0}%
              </p>
              <p className="text-gray-300 text-sm">Resolution Rate</p>
              <p className="text-gray-400 text-xs mt-2">
                {data.allIssues.totalClosed} of {data.allIssues.totalRaised} resolved
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400">
          <p>Dashboard automatically refreshes every 5 minutes</p>
          <button 
            onClick={fetchData}
            className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
