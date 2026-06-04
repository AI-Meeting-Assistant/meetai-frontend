// @trace UC-07-EXC-3.0.E1 — invalid recorded file rejected
// @trace UC-02-NF — offset alignment with media chunk duration

import { describe, expect, it } from 'vitest';
import {
  RECORDED_ACCEPT_EXTENSIONS,
  StreamBadRequestError,
  StreamUnauthorizedError,
  validateRecordedFile,
} from '../../src/services/media-upload.service';

describe('validateRecordedFile', () => {
  it('rejects unsupported extension', () => {
    const file = new File(['x'], 'notes.txt', { type: 'text/plain' });
    const err = validateRecordedFile(file);
    expect(err).toContain('Unsupported');
  });

  it('rejects empty file', () => {
    const file = new File([], 'empty.wav', { type: 'audio/wav' });
    expect(validateRecordedFile(file)).toBe('File is empty');
  });

  it('accepts allowed extensions', () => {
    const file = new File([new Uint8Array([1, 2])], 'meet.mp4', { type: 'video/mp4' });
    expect(validateRecordedFile(file)).toBeNull();
    expect(RECORDED_ACCEPT_EXTENSIONS).toContain('.mp4');
  });
});

describe('upload error types', () => {
  it('StreamUnauthorizedError has stable name', () => {
    expect(new StreamUnauthorizedError().name).toBe('StreamUnauthorizedError');
  });

  it('StreamBadRequestError carries message', () => {
    const e = new StreamBadRequestError('offsetMs invalid');
    expect(e.message).toContain('offsetMs');
  });
});
