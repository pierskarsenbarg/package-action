import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';

export async function run(): Promise<void> {
  try {
    const workingDir = path.resolve(core.getInput('working-directory') || '.');

    if (!fs.existsSync(workingDir)) {
      core.setFailed(`working-directory does not exist: ${workingDir}`);
      return;
    }

    const entries = fs.readdirSync(workingDir, { withFileTypes: true });
    const folders = entries.filter(e => e.isDirectory());

    if (folders.length === 0) {
      core.warning(`No folders found in ${workingDir}`);
      core.setOutput('zip-files', '[]');
      return;
    }

    const zipFiles: string[] = [];

    for (const folder of folders) {
      const folderPath = path.join(workingDir, folder.name);
      const zipName = `${folder.name}.zip`;
      const zipPath = path.join(workingDir, zipName);

      core.info(`Zipping ${folder.name} -> ${zipName}`);

      await new Promise<void>((resolve, reject) => {
        execFile('zip', ['-r', zipPath, '.'], { cwd: folderPath }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      zipFiles.push(zipName);
      core.info(`Created ${zipName}`);
    }

    core.setOutput('zip-files', JSON.stringify(zipFiles));
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

if (require.main === module) {
  run().catch(err => {
    core.setFailed(err?.stderr ?? err?.message ?? String(err));
  });
}
