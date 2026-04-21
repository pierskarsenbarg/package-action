import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Dirent } from 'fs';

vi.mock('@actions/core');
vi.mock('fs');
vi.mock('child_process');

import * as core from '@actions/core';
import * as fs from 'fs';
import * as childProcess from 'child_process';

const mockCore = vi.mocked(core);
const mockFs = vi.mocked(fs);
const mockExecFile = vi.mocked(childProcess.execFile);

function makeDirent(name: string, isDir: boolean): Dirent {
  return {
    name,
    isDirectory: () => isDir,
    isFile: () => !isDir,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    path: '',
    parentPath: '',
  } as Dirent;
}

beforeEach(() => {
  vi.resetAllMocks();
  mockCore.getInput.mockReturnValue('');
  mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
    (callback as (err: null) => void)(null);
    return {} as ReturnType<typeof childProcess.execFile>;
  });
});

describe('run', () => {
  it('fails when working-directory does not exist', async () => {
    mockFs.existsSync.mockReturnValue(false);

    const { run } = await import('../main');
    await run();

    expect(mockCore.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('working-directory does not exist')
    );
  });

  it('warns when no folders are found and outputs empty array', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue([
      makeDirent('file.txt', false),
    ] as unknown as ReturnType<typeof fs.readdirSync>);

    const { run } = await import('../main');
    await run();

    expect(mockCore.warning).toHaveBeenCalledWith(expect.stringContaining('No folders found'));
    expect(mockCore.setOutput).toHaveBeenCalledWith('zip-files', '[]');
    expect(mockExecFile).not.toHaveBeenCalled();
  });

  it('zips each top-level folder and outputs their names', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue([
      makeDirent('alpha', true),
      makeDirent('beta', true),
      makeDirent('readme.md', false),
    ] as unknown as ReturnType<typeof fs.readdirSync>);

    const { run } = await import('../main');
    await run();

    expect(mockExecFile).toHaveBeenCalledTimes(2);
    expect(mockExecFile).toHaveBeenCalledWith(
      'zip',
      expect.arrayContaining([expect.stringContaining('alpha.zip')]),
      expect.objectContaining({ cwd: expect.stringContaining('alpha') }),
      expect.any(Function)
    );
    expect(mockExecFile).toHaveBeenCalledWith(
      'zip',
      expect.arrayContaining([expect.stringContaining('beta.zip')]),
      expect.objectContaining({ cwd: expect.stringContaining('beta') }),
      expect.any(Function)
    );
    expect(mockCore.setOutput).toHaveBeenCalledWith(
      'zip-files',
      JSON.stringify(['alpha.zip', 'beta.zip'])
    );
  });

  it('uses the provided working-directory input', async () => {
    mockCore.getInput.mockReturnValue('/custom/path');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue([
      makeDirent('pkg', true),
    ] as unknown as ReturnType<typeof fs.readdirSync>);

    const { run } = await import('../main');
    await run();

    expect(mockFs.readdirSync).toHaveBeenCalledWith('/custom/path', expect.anything());
  });

  it('calls setFailed when zip command errors', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue([
      makeDirent('broken', true),
    ] as unknown as ReturnType<typeof fs.readdirSync>);
    mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
      (callback as (err: Error) => void)(new Error('zip not found'));
      return {} as ReturnType<typeof childProcess.execFile>;
    });

    const { run } = await import('../main');
    await run();

    expect(mockCore.setFailed).toHaveBeenCalledWith('zip not found');
  });
});
