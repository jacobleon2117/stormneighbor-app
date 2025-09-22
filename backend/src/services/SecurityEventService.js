class SecurityEventService {
  logEvent(_eventType, _details) {
    return Promise.resolve();
  }
}

module.exports = new SecurityEventService();
