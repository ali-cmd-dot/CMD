class SheetsService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  }

  async fetchSheetData(spreadsheetId, range) {
    try {
      const url = `${this.baseUrl}/${spreadsheetId}/values/${range}?key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      throw error;
    }
  }

  parseSheetData(rawData, headers) {
    if (!rawData || rawData.length < 2) return [];
    
    const headerRow = rawData[0];
    const dataRows = rawData.slice(1);
    
    return dataRows.map(row => {
      const obj = {};
      headerRow.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
  }

  async getAlertTrackingData() {
    const spreadsheetId = '1GPDqOSURZNALalPzfHNbMft0HQ1c_fIkgfu_V3fSroY';
    const range = 'Alert_Tracking!A:Z';
    
    try {
      const rawData = await this.fetchSheetData(spreadsheetId, range);
      const parsedData = this.parseSheetData(rawData);
      
      // Filter out 'No L2 alerts found'
      return parsedData.filter(row => 
        row['Alert Type'] && row['Alert Type'] !== 'No L2 alerts found'
      );
    } catch (error) {
      console.error('Error fetching alert tracking data:', error);
      return [];
    }
  }

  async getMisalignmentTrackingData() {
    const spreadsheetId = '1GPDqOSURZNALalPzfHNbMft0HQ1c_fIkgfu_V3fSroY';
    const range = 'Misalignment_Tracking!A:Z';
    
    try {
      const rawData = await this.fetchSheetData(spreadsheetId, range);
      return this.parseSheetData(rawData);
    } catch (error) {
      console.error('Error fetching misalignment tracking data:', error);
      return [];
    }
  }

  async getIssuesRealtimeData() {
    const spreadsheetId = '1DzW-6Q7hTNn2hSJbEHOkSrbalOmbDIftdjw4I_PhEdA';
    const range = 'Issues- Realtime!A:Z';
    
    try {
      const rawData = await this.fetchSheetData(spreadsheetId, range);
      const parsedData = this.parseSheetData(rawData);
      
      // Filter for Historical Video Request only
      return parsedData.filter(row => 
        row['Sub-request'] && row['Sub-request'].includes('Historical Video Request')
      );
    } catch (error) {
      console.error('Error fetching issues realtime data:', error);
      return [];
    }
  }

  async getAllIssuesData() {
    const spreadsheetId = '1DzW-6Q7hTNn2hSJbEHOkSrbalOmbDIftdjw4I_PhEdA';
    const range = 'Issues- Realtime!A:Z';
    
    try {
      const rawData = await this.fetchSheetData(spreadsheetId, range);
      return this.parseSheetData(rawData);
    } catch (error) {
      console.error('Error fetching all issues data:', error);
      return [];
    }
  }
}

export default SheetsService;
