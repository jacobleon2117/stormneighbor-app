const fs = require('fs').promises;
const path = require('path');

class FeedbackLogger {
  constructor() {
    this.logsDir = path.join(__dirname, '../../logs');
    this.feedbackDir = path.join(this.logsDir, 'feedback');
    this.init();
  }

  async init() {
    try {
      // Create logs directory if it doesn't exist
      await fs.mkdir(this.logsDir, { recursive: true });
      // Create feedback directory if it doesn't exist
      await fs.mkdir(this.feedbackDir, { recursive: true });
    } catch (error) {
      console.error('Error creating feedback directories:', error);
    }
  }

  async logFeedback(feedbackData) {
    try {
      const timestamp = new Date();
      const dateStr = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = timestamp.toISOString().replace(/[:.]/g, '-'); // Safe filename
      
      // Enhanced feedback data with metadata
      const enhancedFeedback = {
        ...feedbackData,
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        submittedAt: timestamp.toISOString(),
        submittedAtFormatted: timestamp.toLocaleString('en-US', {
          timeZone: 'America/Chicago',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      };

      // Save to individual JSON file
      const jsonFileName = `${timeStr}_${feedbackData.feedbackType}_${feedbackData.userId || 'unknown'}.json`;
      const jsonFilePath = path.join(this.feedbackDir, jsonFileName);
      await fs.writeFile(jsonFilePath, JSON.stringify(enhancedFeedback, null, 2));

      // Append to master JSON log
      const masterJsonPath = path.join(this.feedbackDir, 'all_feedback.json');
      await this.appendToMasterJson(masterJsonPath, enhancedFeedback);

      // Append to daily markdown log
      const markdownPath = path.join(this.feedbackDir, `feedback_${dateStr}.md`);
      await this.appendToMarkdown(markdownPath, enhancedFeedback);

      // Update master markdown log
      const masterMarkdownPath = path.join(this.feedbackDir, 'feedback_summary.md');
      await this.updateMasterMarkdown(masterMarkdownPath, enhancedFeedback);

      console.log(`✅ Feedback logged to files: ${jsonFileName}`);
      return enhancedFeedback;
    } catch (error) {
      console.error('Error logging feedback:', error);
      return feedbackData;
    }
  }

  async appendToMasterJson(filePath, feedbackData) {
    try {
      let existingData = [];
      try {
        const existingContent = await fs.readFile(filePath, 'utf8');
        existingData = JSON.parse(existingContent);
      } catch (error) {
        // File doesn't exist or is empty, start with empty array
      }

      existingData.push(feedbackData);
      await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
    } catch (error) {
      console.error('Error updating master JSON:', error);
    }
  }

  async appendToMarkdown(filePath, feedbackData) {
    const markdownEntry = this.formatAsMarkdown(feedbackData);
    
    try {
      // Check if file exists
      let existingContent = '';
      try {
        existingContent = await fs.readFile(filePath, 'utf8');
      } catch (error) {
        // File doesn't exist, create header
        const dateStr = feedbackData.submittedAt.split('T')[0];
        existingContent = `# Feedback Log - ${dateStr}\n\n`;
      }

      const updatedContent = existingContent + markdownEntry + '\n---\n\n';
      await fs.writeFile(filePath, updatedContent);
    } catch (error) {
      console.error('Error updating daily markdown:', error);
    }
  }

  async updateMasterMarkdown(filePath, feedbackData) {
    try {
      let existingContent = '';
      try {
        existingContent = await fs.readFile(filePath, 'utf8');
      } catch (error) {
        // File doesn't exist, create header
        existingContent = `# StormNeighbor App - User Feedback Summary\n\n*Last updated: ${new Date().toLocaleString()}*\n\n## Recent Feedback\n\n`;
      }

      const markdownEntry = this.formatAsMarkdown(feedbackData);
      
      // Insert new feedback at the top (after the header)
      const lines = existingContent.split('\n');
      const headerEndIndex = lines.findIndex(line => line.includes('## Recent Feedback')) + 2;
      
      lines.splice(headerEndIndex, 0, markdownEntry, '---', '');
      
      // Update the "Last updated" timestamp
      const updatedLines = lines.map(line => 
        line.includes('*Last updated:') ? 
        `*Last updated: ${new Date().toLocaleString()}*` : 
        line
      );

      await fs.writeFile(filePath, updatedLines.join('\n'));
    } catch (error) {
      console.error('Error updating master markdown:', error);
    }
  }

  formatAsMarkdown(feedbackData) {
    const typeEmojis = {
      'bug_report': '🐛',
      'feature_request': '💡',
      'general_feedback': '💬',
      'ui_ux_feedback': '🎨'
    };

    const priorityEmojis = {
      'low': '🟢',
      'normal': '🟡',
      'high': '🔴'
    };

    return `## ${typeEmojis[feedbackData.feedbackType] || '📝'} ${feedbackData.title}

**Type:** ${feedbackData.feedbackType.replace('_', ' ').toUpperCase()}  
**Priority:** ${priorityEmojis[feedbackData.priority] || '⚪'} ${feedbackData.priority.toUpperCase()}  
**User ID:** ${feedbackData.userId || 'Unknown'}  
**Submitted:** ${feedbackData.submittedAtFormatted}  
**App Version:** ${feedbackData.appVersion || 'Not specified'}  
**Device:** ${feedbackData.deviceInfo || 'Not specified'}

### Description
${feedbackData.description}

**Feedback ID:** \`${feedbackData.id}\``;
  }

  async getFeedbackStats() {
    try {
      const masterJsonPath = path.join(this.feedbackDir, 'all_feedback.json');
      const content = await fs.readFile(masterJsonPath, 'utf8');
      const allFeedback = JSON.parse(content);

      const stats = {
        total: allFeedback.length,
        byType: {},
        byPriority: {},
        recent24h: 0,
        recent7days: 0
      };

      const now = new Date();
      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

      allFeedback.forEach(feedback => {
        // Count by type
        stats.byType[feedback.feedbackType] = (stats.byType[feedback.feedbackType] || 0) + 1;
        
        // Count by priority
        stats.byPriority[feedback.priority] = (stats.byPriority[feedback.priority] || 0) + 1;
        
        // Count recent feedback
        const feedbackDate = new Date(feedback.submittedAt);
        if (feedbackDate > oneDayAgo) stats.recent24h++;
        if (feedbackDate > sevenDaysAgo) stats.recent7days++;
      });

      return stats;
    } catch (error) {
      console.error('Error getting feedback stats:', error);
      return { total: 0, byType: {}, byPriority: {}, recent24h: 0, recent7days: 0 };
    }
  }
}

module.exports = new FeedbackLogger();