import fetch from 'node-fetch';

class CronJobExecutor {
  static emitLog(io, jobId, message, logType = 'info') {
    if (io) {
      io.emit('cronJobLog', {
        jobId,
        message,
        logType,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static buildReleasePayload(buildConfig, cronJobId = null) {
    return {
      ticketNumber: buildConfig.ticketNumber,
      selectedPackages: buildConfig.selectedPackages || [],
      createPullRequest: buildConfig.createPullRequest || false,
      repoKey: buildConfig.repoKey,
      repoSlug: buildConfig.repoSlug,
      gitRepos: buildConfig.gitRepos,
      scriptPath: buildConfig.scriptPath,
      cronJobId, // Pass the cron job ID to the build API
    };
  }

  static async callReleaseAPI(payload) {
    const apiUrl = 'http://localhost:3000/api/build/release';
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Release API returned status ${response.status}: ${errorData.message || 'Unknown error'}`
      );
    }

    return response.json();
  }

  static async executeBuild(io, jobId, job) {
    try {
      const { buildConfig } = job;
      if (!buildConfig) {
        throw new Error('No build configuration found in cron job');
      }

      this.emitLog(io, jobId, `Starting release build with config: ${JSON.stringify(buildConfig)}`, 'info');

      const payload = this.buildReleasePayload(buildConfig, jobId);
      this.emitLog(io, jobId, `Calling release API with payload: ${JSON.stringify(payload, null, 2)}`, 'start');

      const result = await this.callReleaseAPI(payload);
      this.emitLog(io, jobId, `Release API response: ${JSON.stringify(result)}`, 'info');
      this.emitLog(io, jobId, 'Build process started via release API. Waiting for build completion...', 'info');

      return { success: true, buildId: result.buildId };
    } catch (error) {
      this.emitLog(io, jobId, `Execution error: ${error.message}`, 'error');
      throw error;
    }
  }
}

export default CronJobExecutor;
