import { NextRequest, NextResponse } from 'next/server';
import { writeFile, appendFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';

/**
 * API route to save game logs to a file in the project folder
 * POST /api/save-logs
 * Supports appending to existing file for periodic auto-saves
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { logs, append = false, sessionStartTime } = body;

    if (!logs || !Array.isArray(logs)) {
      return NextResponse.json(
        { error: 'Invalid request: logs array is required' },
        { status: 400 }
      );
    }

    // Create logs directory in project root if it doesn't exist
    const logsDir = join(process.cwd(), 'logs');
    try {
      await mkdir(logsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
    }

    // Create filename - use sessionStartTime if provided (for append mode), otherwise use current timestamp
    const timestamp = sessionStartTime || new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `game-logs-${timestamp}.txt`;
    const filepath = join(logsDir, filename);

    let fileExists = false;
    try {
      await access(filepath, constants.F_OK);
      fileExists = true;
    } catch {
      // File doesn't exist yet
    }

    if (append && fileExists) {
      // Append mode: just append new logs
      const content = logs.join('\n') + '\n';
      await appendFile(filepath, content, 'utf-8');
    } else {
      // Create new file or overwrite with header
      const header = `=== Game Logs ===\nGenerated: ${new Date().toISOString()}\nSession Start: ${sessionStartTime || new Date().toISOString()}\nTotal Logs: ${logs.length}\n\n`;
      const content = header + logs.join('\n');
      await writeFile(filepath, content, 'utf-8');
    }

    return NextResponse.json({
      success: true,
      message: append ? `Appended ${logs.length} log entries to ${filename}` : `Logs saved to ${filename}`,
      filename,
      path: filepath,
      logCount: logs.length,
      appended: append,
    });
  } catch (error) {
    console.error('Error saving logs:', error);
    return NextResponse.json(
      {
        error: 'Failed to save logs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

