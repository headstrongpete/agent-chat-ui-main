import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the HAR file
const harFilePath = join(__dirname, '../har_log/localhost.har');

// Function to find API responses containing thread data
function analyzeHarFile() {
  try {
    // Read the HAR file
    const harFileContent = readFileSync(harFilePath, 'utf8');
    const harData = JSON.parse(harFileContent);
    
    // Find API responses that might contain thread data
    const threadResponses = harData.log.entries.filter(entry => {
      const url = entry.request.url;
      return (
        url.includes('/threads') || 
        url.includes('/thread') ||
        url.includes('search')
      );
    });
    
    console.log(`Found ${threadResponses.length} potential thread-related API responses`);
    
    // Analyze each response
    threadResponses.forEach((entry, index) => {
      const url = entry.request.url;
      console.log(`\n[${index + 1}] URL: ${url}`);
      
      try {
        // Parse the response content
        let responseContent;
        if (entry.response.content.text) {
          responseContent = JSON.parse(entry.response.content.text);
        } else {
          console.log('  No response content');
          return;
        }
        
        // Check if this is an array of thread objects or if it contains a threads array
        let threads = responseContent;
        if (!Array.isArray(responseContent) && responseContent.threads) {
          threads = responseContent.threads;
        }
        
        // Skip if no threads found
        if (!Array.isArray(threads) || threads.length === 0) {
          console.log('  No thread array found in response');
          return;
        }
        
        // Examine the first thread
        const sampleThread = threads[0];
        console.log(`  Sample thread ID: ${sampleThread.thread_id || 'unknown'}`);
        
        // Check for timestamp properties
        const threadKeys = Object.keys(sampleThread);
        console.log(`  Thread object keys: ${threadKeys.join(', ')}`);
        
        // Look for timestamp-related properties
        const timestampKeys = threadKeys.filter(key => 
          key.includes('time') || 
          key.includes('date') || 
          key.includes('timestamp') || 
          key.includes('created') ||
          key.includes('updated')
        );
        
        if (timestampKeys.length > 0) {
          console.log(`  Found timestamp properties: ${timestampKeys.join(', ')}`);
          timestampKeys.forEach(key => {
            console.log(`    ${key}: ${sampleThread[key]}`);
          });
        } else {
          console.log('  No explicit timestamp properties found');
        }
        
        // Check if messages contain timestamps
        if (sampleThread.values && 
            typeof sampleThread.values === 'object' && 
            sampleThread.values !== null && 
            sampleThread.values.messages && 
            Array.isArray(sampleThread.values.messages) && 
            sampleThread.values.messages.length > 0
        ) {
          const message = sampleThread.values.messages[0];
          console.log('  First message keys:', Object.keys(message).join(', '));
          
          const messageTimestampKeys = Object.keys(message).filter(key => 
            key.includes('time') || 
            key.includes('date') || 
            key.includes('timestamp') || 
            key.includes('created') ||
            key.includes('updated')
          );
          
          if (messageTimestampKeys.length > 0) {
            console.log(`  Found message timestamp properties: ${messageTimestampKeys.join(', ')}`);
            messageTimestampKeys.forEach(key => {
              console.log(`    ${key}: ${message[key]}`);
            });
          } else {
            console.log('  No timestamp properties in messages');
          }
        }
        
        // Check if thread_id contains potential timestamp info
        if (sampleThread.thread_id) {
          const timestampMatches = sampleThread.thread_id.match(/(\d{10,13})/);
          const isoDateMatches = sampleThread.thread_id.match(/(\d{4}-\d{2}-\d{2})/);
          
          if (timestampMatches && timestampMatches[1]) {
            const timestamp = parseInt(timestampMatches[1]);
            const date = new Date(timestamp);
            console.log(`  Thread ID contains timestamp: ${timestamp} (${date.toISOString()})`);
          } else if (isoDateMatches && isoDateMatches[1]) {
            console.log(`  Thread ID contains date: ${isoDateMatches[1]}`);
          }
        }
        
        // Check if metadata contains timestamp info
        if (sampleThread.metadata && typeof sampleThread.metadata === 'object') {
          console.log('  Metadata keys:', Object.keys(sampleThread.metadata).join(', '));
          
          const metadataTimestampKeys = Object.keys(sampleThread.metadata).filter(key => 
            key.includes('time') || 
            key.includes('date') || 
            key.includes('timestamp') || 
            key.includes('created') ||
            key.includes('updated')
          );
          
          if (metadataTimestampKeys.length > 0) {
            console.log(`  Found metadata timestamp properties: ${metadataTimestampKeys.join(', ')}`);
            metadataTimestampKeys.forEach(key => {
              console.log(`    ${key}: ${sampleThread.metadata[key]}`);
            });
          }
        }
        
        // Save a sample thread to a file for detailed inspection
        if (index === 0) {
          const sampleThreadFile = join(__dirname, '../har_log/sample_thread.json');
          writeFileSync(
            sampleThreadFile, 
            JSON.stringify(sampleThread, null, 2), 
            'utf8'
          );
          console.log(`  Saved sample thread to ${sampleThreadFile}`);
        }
        
      } catch (err) {
        console.error(`  Error parsing response: ${err.message}`);
      }
    });
    
  } catch (err) {
    console.error(`Failed to analyze HAR file: ${err.message}`);
  }
}

// Run the analysis
analyzeHarFile(); 