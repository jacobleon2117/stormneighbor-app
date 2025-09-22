const fs = require("fs").promises;
const path = require("path");
const { randomUUID } = require("crypto");
const logger = require("../utils/logger");

class FeedbackLogger {
  constructor() {
    this.logsDir = path.join(__dirname, "../../logs");
    this.feedbackDir = path.join(this.logsDir, "feedback");
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.logsDir, { recursive: true });
      await fs.mkdir(this.feedbackDir, { recursive: true });
    } catch (error) {
      logger.error("Error creating feedback directories:", error);
    }
  }

  async logFeedback(feedbackData) {
    try {
      const timestamp = new Date();
      const dateStr = timestamp.toISOString().split("T")[0];
      const timeStr = timestamp.toISOString().replace(/[:.]/g, "-");

      const enhancedFeedback = {
        ...feedbackData,
        id: `feedback_${randomUUID()}`,
        submittedAt: timestamp.toISOString(),
        submittedAtFormatted: timestamp.toLocaleString("en-US", {
          timeZone: "America/Chicago",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      };

      const jsonFileName = `${timeStr}_${feedbackData.feedbackType}_${feedbackData.userId || "unknown"}.json`;
      const jsonFilePath = path.join(this.feedbackDir, jsonFileName);
      await fs.writeFile(jsonFilePath, JSON.stringify(enhancedFeedback, null, 2));

      const masterJsonPath = path.join(this.feedbackDir, "all_feedback.json");
      await this.appendToMasterJson(masterJsonPath, enhancedFeedback);

      const markdownPath = path.join(this.feedbackDir, `feedback_${dateStr}.md`);
      await this.appendToMarkdown(markdownPath, enhancedFeedback);

      const masterMarkdownPath = path.join(this.feedbackDir, "feedback_summary.md");
      await this.updateMasterMarkdown(masterMarkdownPath, enhancedFeedback);

      logger.info(`SUCCESS: Feedback logged to files: ${jsonFileName}`);
      return enhancedFeedback;
    } catch (error) {
      logger.error("ERROR: Error logging feedback:", error);
      return feedbackData;
    }
  }

  async appendToMasterJson(filePath, feedbackData) {
    try {
      let existingData = [];
      try {
        const existingContent = await fs.readFile(filePath, "utf8");
        existingData = JSON.parse(existingContent);
        if (!Array.isArray(existingData)) existingData = [];
      } catch {
        existingData = [];
      }

      existingData.push(feedbackData);
      await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
    } catch (error) {
      logger.error("Error updating master JSON:", error);
    }
  }

  async appendToMarkdown(filePath, feedbackData) {
    const markdownEntry = this.formatAsMarkdown(feedbackData);

    try {
      let existingContent = "";
      try {
        existingContent = await fs.readFile(filePath, "utf8");
      } catch {
        const dateStr = feedbackData.submittedAt.split("T")[0];
        existingContent = `# Feedback Log - ${dateStr}\n\n`;
      }

      const updatedContent = existingContent + markdownEntry + "\n---\n\n";
      await fs.writeFile(filePath, updatedContent);
    } catch (error) {
      logger.error("Error updating daily markdown:", error);
    }
  }

  async updateMasterMarkdown(filePath, feedbackData) {
    try {
      let existingContent = "";
      try {
        existingContent = await fs.readFile(filePath, "utf8");
      } catch {
        existingContent = `# StormNeighbor App - User Feedback Summary\n\n*Last updated: ${new Date().toLocaleString()}*\n\n## Recent Feedback\n\n`;
      }

      const markdownEntry = this.formatAsMarkdown(feedbackData);

      const lines = existingContent.split("\n");
      const headerEndIndex = lines.findIndex((line) => line.includes("## Recent Feedback")) + 2;

      lines.splice(headerEndIndex, 0, markdownEntry, "---", "");

      const updatedLines = lines.map((line) =>
        line.includes("*Last updated:") ? `*Last updated: ${new Date().toLocaleString()}*` : line
      );

      await fs.writeFile(filePath, updatedLines.join("\n"));
    } catch (error) {
      logger.error("Error updating master markdown:", error);
    }
  }

  formatAsMarkdown(feedbackData) {
    const typeLabels = {
      bug_report: "Bug",
      feature_request: "Feature",
      general_feedback: "General",
      ui_ux_feedback: "UI/UX",
    };

    const priorityLabels = {
      low: "Low",
      normal: "Normal",
      high: "High",
    };

    return `## ${typeLabels[feedbackData.feedbackType] || "Feedback"} - ${feedbackData.title}

    **Type:** ${feedbackData.feedbackType.replace("_", " ").toUpperCase()}  
    **Priority:** ${priorityLabels[feedbackData.priority] || "Normal"}  
    **User ID:** ${feedbackData.userId || "Unknown"}  
    **Submitted:** ${feedbackData.submittedAtFormatted}  
    **App Version:** ${feedbackData.appVersion || "Not specified"}  
    **Device:** ${feedbackData.deviceInfo || "Not specified"}

    ### Description
    ${feedbackData.description}

    **Feedback ID:** \`${feedbackData.id}\``;
  }

  async getFeedbackStats() {
    try {
      const masterJsonPath = path.join(this.feedbackDir, "all_feedback.json");
      const content = await fs.readFile(masterJsonPath, "utf8");
      const allFeedback = JSON.parse(content);

      const stats = {
        total: allFeedback.length,
        byType: {},
        byPriority: {},
        recent24h: 0,
        recent7days: 0,
      };

      const now = new Date();
      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

      allFeedback.forEach((feedback) => {
        stats.byType[feedback.feedbackType] = (stats.byType[feedback.feedbackType] || 0) + 1;
        stats.byPriority[feedback.priority] = (stats.byPriority[feedback.priority] || 0) + 1;

        const feedbackDate = new Date(feedback.submittedAt);
        if (feedbackDate > oneDayAgo) stats.recent24h++;
        if (feedbackDate > sevenDaysAgo) stats.recent7days++;
      });

      return stats;
    } catch (error) {
      logger.error("ERROR: Error getting feedback stats:", error);
      return { total: 0, byType: {}, byPriority: {}, recent24h: 0, recent7days: 0 };
    }
  }
}

module.exports = new FeedbackLogger();
