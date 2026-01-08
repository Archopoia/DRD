import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * API route to save game logs to a file in the project folder
 * POST /api/save-logs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { logs } = body;

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

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `game-logs-${timestamp}.txt`;
    const filepath = join(logsDir, filename);

    // Create log file content with header
    const header = `=== Game Logs ===\nGenerated: ${new Date().toISOString()}\nTotal Logs: ${logs.length}\n\n`;
    const content = header + logs.join('\n');

    // Write file
    await writeFile(filepath, content, 'utf-8');

    return NextResponse.json({
      success: true,
      message: `Logs saved to ${filename}`,
      filename,
      path: filepath,
      logCount: logs.length,
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

