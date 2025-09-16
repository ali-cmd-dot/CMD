import SheetsService from '../../utils/sheetsService';
import { parseISO, format, isValid } from 'date-fns';

const sheetsService = new SheetsService(process.env.GOOGLE_SHEETS_API_KEY);

function parseDate(dateString) {
  if (!dateString) return null;
  
  const date = parseISO(dateString);
  return isValid(date) ? date : null;
}

function getMonth(dateString) {
  const date = parseDate(dateString);
  return date ? format(date, 'yyyy-MM') : null;
}

function calculateTimeDifference(startDate, endDate) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  if (!start || !end) return null;
  
  return Math.abs(end - start) / (1000 * 60 * 60); // hours
}

function getStatistics(values) {
  if (!values || values.length === 0) return { min: 0, median: 0, max: 0 };
  
  const sorted = values.sort((a, b) => a - b);
  const median = sorted.length % 2 === 0 
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
    
  return {
    min: sorted[0],
    median: median,
    max: sorted[sorted.length - 1]
  };
}

export default async function handler(req, res) {
  try {
    // Fetch all data
    const alertData = await sheetsService.getAlertTrackingData();
    const misalignmentData = await sheetsService.getMisalignmentTrackingData();
    const historicalVideoData = await sheetsService.getIssuesRealtimeData();
    const allIssuesData = await sheetsService.getAllIssuesData();

    // Process Alert Tracking Data
    const alertStats = {
      total: alertData.length,
      monthlyBreakdown: {},
      clientBreakdown: {}
    };

    alertData.forEach(row => {
      const month = getMonth(row['Date']);
      const client = row['Client Name'] || 'Unknown';
      
      if (month) {
        alertStats.monthlyBreakdown[month] = (alertStats.monthlyBreakdown[month] || 0) + 1;
        
        if (!alertStats.clientBreakdown[month]) {
          alertStats.clientBreakdown[month] = {};
        }
        alertStats.clientBreakdown[month][client] = (alertStats.clientBreakdown[month][client] || 0) + 1;
      }
    });

    // Process Misalignment Data
    const misalignmentStats = {
      total: 0,
      monthlyBreakdown: {},
      clientBreakdown: {}
    };

    misalignmentData.forEach(row => {
      const count = parseInt(row['Count']) || 0;
      const month = getMonth(row['Date']);
      const client = row['Client Name'] || 'Unknown';
      
      misalignmentStats.total += count;
      
      if (month) {
        misalignmentStats.monthlyBreakdown[month] = (misalignmentStats.monthlyBreakdown[month] || 0) + count;
        
        if (!misalignmentStats.clientBreakdown[month]) {
          misalignmentStats.clientBreakdown[month] = {};
        }
        misalignmentStats.clientBreakdown[month][client] = (misalignmentStats.clientBreakdown[month][client] || 0) + count;
      }
    });

    // Process Historical Video Requests
    const resolutionTimes = [];
    const historicalVideoStats = {
      total: historicalVideoData.length,
      monthlyBreakdown: {},
      clientBreakdown: {},
      resolutionStats: { min: 0, median: 0, max: 0 }
    };

    historicalVideoData.forEach(row => {
      const month = getMonth(row['Timestamp Issues Raised']);
      const client = row['Clients'] || 'Unknown';
      const resolutionTime = calculateTimeDifference(
        row['Timestamp Issues Raised'], 
        row['Timestamp Issues Resolved']
      );
      
      if (resolutionTime !== null) {
        resolutionTimes.push(resolutionTime);
      }
      
      if (month) {
        historicalVideoStats.monthlyBreakdown[month] = (historicalVideoStats.monthlyBreakdown[month] || 0) + 1;
        
        if (!historicalVideoStats.clientBreakdown[month]) {
          historicalVideoStats.clientBreakdown[month] = {};
        }
        historicalVideoStats.clientBreakdown[month][client] = (historicalVideoStats.clientBreakdown[month][client] || 0) + 1;
      }
    });

    historicalVideoStats.resolutionStats = getStatistics(resolutionTimes);

    // Process All Issues Data
    const allIssuesResolutionTimes = [];
    const allIssuesStats = {
      totalRaised: 0,
      totalClosed: 0,
      monthlyRaised: {},
      monthlyClosed: {},
      clientBreakdown: {},
      resolutionStats: { min: 0, median: 0, max: 0 }
    };

    allIssuesData.forEach(row => {
      const raisedMonth = getMonth(row['Timestamp Issues Raised']);
      const resolvedMonth = getMonth(row['Timestamp Issues Resolved']);
      const client = row['Clients'] || 'Unknown';
      const resolutionTime = calculateTimeDifference(
        row['Timestamp Issues Raised'], 
        row['Timestamp Issues Resolved']
      );
      
      // Count raised issues
      if (raisedMonth) {
        allIssuesStats.totalRaised++;
        allIssuesStats.monthlyRaised[raisedMonth] = (allIssuesStats.monthlyRaised[raisedMonth] || 0) + 1;
      }
      
      // Count closed issues
      if (resolvedMonth) {
        allIssuesStats.totalClosed++;
        allIssuesStats.monthlyClosed[resolvedMonth] = (allIssuesStats.monthlyClosed[resolvedMonth] || 0) + 1;
      }
      
      // Client breakdown
      if (raisedMonth) {
        if (!allIssuesStats.clientBreakdown[raisedMonth]) {
          allIssuesStats.clientBreakdown[raisedMonth] = {};
        }
        allIssuesStats.clientBreakdown[raisedMonth][client] = (allIssuesStats.clientBreakdown[raisedMonth][client] || 0) + 1;
      }
      
      // Resolution times
      if (resolutionTime !== null) {
        allIssuesResolutionTimes.push(resolutionTime);
      }
    });

    allIssuesStats.resolutionStats = getStatistics(allIssuesResolutionTimes);

    res.status(200).json({
      alertTracking: alertStats,
      misalignmentTracking: misalignmentStats,
      historicalVideoRequests: historicalVideoStats,
      allIssues: allIssuesStats,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}
