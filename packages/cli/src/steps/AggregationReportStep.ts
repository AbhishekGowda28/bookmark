import type { Step } from '@bookmark/pipeline';
import type { AggregationData } from '../pipeline-context.js';
import { getConfig, getLinks } from '../pipeline-context.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * AggregationReportStep: Generate aggregation summary report
 * 
 * Input Contract:
 *   - data.projectRoot: Root directory for report location
 *   - data.config: Feed configuration (for context)
 *   - data.links: Aggregated links
 *   - data.errors: Any errors that occurred during aggregation
 * 
 * Output Contract:
 *   - Prints console report with statistics
 *   - Optionally writes aggregation-report.json with detailed results
 * 
 * Report includes:
 *   - Total links aggregated
 *   - Per-feed link counts
 *   - Per-feed error counts
 *   - Overall success/warning status
 */
export class AggregationReportStep implements Step<AggregationData, AggregationData> {
  name = 'AggregationReport';
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  async execute(data: AggregationData): Promise<AggregationData> {
    console.log('\n📊 Aggregation Summary Report\n');
    console.log('─'.repeat(50));

    try {
      const config = getConfig(data);
      const allLinks = getLinks(data);
      const rssLinks = data.links || [];
      const errors = data.errors || [];

      // Group links and errors by feed
      const feedStats = new Map<string, { success: number; errors: number }>();

      // Initialize stats for all configured feeds
      for (const feed of config.feeds) {
        feedStats.set(feed.id, { success: 0, errors: 0 });
      }

      // Count RSS links per feed
      for (const link of rssLinks) {
        if (link.feed && feedStats.has(link.feed)) {
          const stats = feedStats.get(link.feed)!;
          stats.success += 1;
        }
      }

      // Count errors per feed
      for (const error of errors) {
        if (error.feed && feedStats.has(error.feed)) {
          const stats = feedStats.get(error.feed)!;
          stats.errors += 1;
        }
      }

      // Print summary
      console.log(`📚 Bookmarks:        ${data.bookmarks.length} links`);
      console.log(`📑 Tabs:             ${data.tabs.length} links`);
      console.log(`📡 RSS Feeds:        ${rssLinks.length} links`);
      console.log(`📊 Total Combined:   ${allLinks.length} unique links\n`);

      // Print per-feed stats
      if (feedStats.size > 0) {
        console.log('Per-Feed Results:');
        for (const [feedId, stats] of feedStats) {
          const feed = config.feeds.find((f) => f.id === feedId);
          const feedName = feed?.author || feedId;
          const status = stats.errors > 0 ? '⚠️ ' : '✅';
          const errorText = stats.errors > 0 ? ` (${stats.errors} error${stats.errors > 1 ? 's' : ''})` : '';
          console.log(`  ${status} ${feedName}: ${stats.success} links${errorText}`);
        }
      }

      // Print error summary
      const totalErrors = errors.length;
      if (totalErrors > 0) {
        console.log(`\n⚠️  Errors: ${totalErrors} issue${totalErrors > 1 ? 's' : ''} encountered`);
        if (this.verbose) {
          console.log('\nDetailed Errors:');
          for (const error of errors) {
            const feed = error.feed ? ` [${error.feed}]` : '';
            const severity = error.severity ? ` (${error.severity})` : '';
            console.log(`  • ${error.error}${feed}${severity}`);
          }
        }
      } else {
        console.log('\n✅ All operations completed successfully');
      }

      console.log('─'.repeat(50) + '\n');

      // Optionally write detailed report to JSON
      if (this.verbose || totalErrors > 0) {
        const report = {
          timestamp: new Date().toISOString(),
          summary: {
            bookmarks: data.bookmarks.length,
            tabs: data.tabs.length,
            rssLinks: rssLinks.length,
            totalLinks: allLinks.length,
            totalErrors: totalErrors,
          },
          feeds: Array.from(feedStats, ([id, stats]) => ({ id, ...stats })),
          errors: errors,
        };

        const reportPath = join(data.projectRoot, 'aggregation-report.json');
        writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 Detailed report saved to aggregation-report.json`);
      }

      return data;
    } catch (error) {
      console.warn('⚠️  Failed to generate aggregation report:', error);
      return data;
    }
  }
}

export default AggregationReportStep;
