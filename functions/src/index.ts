import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

initializeApp();
const db = getFirestore();

/**
 * Deletes documents in a query in a batch.
 * Max batch size handled is 500.
 */
async function deleteQueryBatch(query: FirebaseFirestore.Query) {
  const snapshot = await query.get();
  
  if (snapshot.size === 0) {
    return 0;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return snapshot.size;
}

/**
 * Cloud Function triggered daily at midnight to delete logs older than 30 days.
 */
export const dailyLogCleanup = onSchedule("0 0 * * *", async (event) => {
  logger.log("Daily log cleanup job triggered.");
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thresholdISO = thirtyDaysAgo.toISOString();
  const thresholdTimestamp = Timestamp.fromDate(thirtyDaysAgo);

  // 1. Purge 'system_logs' older than 30 days (stored as ISO-8601 strings in 'created_at')
  try {
    logger.log("Purging old 'system_logs' records...");
    const systemLogsQuery = db.collection("system_logs")
      .where("created_at", "<", thresholdISO)
      .limit(500);

    let deletedSystemLogs = 0;
    while (true) {
      const deletedCount = await deleteQueryBatch(systemLogsQuery);
      deletedSystemLogs += deletedCount;
      if (deletedCount < 500) {
        break;
      }
    }
    logger.log(`Purged ${deletedSystemLogs} records from 'system_logs'.`);
  } catch (error) {
    logger.error("Failed to clean up 'system_logs' collection:", error);
  }

  // 2. Purge 'error_logs' older than 30 days (stored as Firestore native Timestamps in 'timestamp')
  try {
    logger.log("Purging old 'error_logs' records with native Firestore Timestamps...");
    const errorLogsTimestampQuery = db.collection("error_logs")
      .where("timestamp", "<", thresholdTimestamp)
      .limit(500);

    let deletedErrorLogsTs = 0;
    while (true) {
      const deletedCount = await deleteQueryBatch(errorLogsTimestampQuery);
      deletedErrorLogsTs += deletedCount;
      if (deletedCount < 500) {
        break;
      }
    }
    logger.log(`Purged ${deletedErrorLogsTs} records from 'error_logs' (Timestamps format).`);

    // fallback check: in case string timestamps exist
    logger.log("Purging old 'error_logs' records with ISO string layout...");
    const errorLogsISOQuery = db.collection("error_logs")
      .where("timestamp", "<", thresholdISO)
      .limit(500);

    let deletedErrorLogsStr = 0;
    while (true) {
      const deletedCount = await deleteQueryBatch(errorLogsISOQuery);
      deletedErrorLogsStr += deletedCount;
      if (deletedCount < 500) {
        break;
      }
    }
    logger.log(`Purged ${deletedErrorLogsStr} records from 'error_logs' (String format).`);
  } catch (error) {
    logger.error("Failed to clean up 'error_logs' collection:", error);
  }

  logger.log("Daily log cleanup completed.");
});
