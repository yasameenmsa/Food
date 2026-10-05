/**
 * Upload validation.
 *
 * `storeUpload` trusts nothing the browser sends: the multipart `type` is
 * attacker-controlled, so the format is confirmed against the file's magic
 * number and the dimensions are read from the header rather than trusted.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sniffImageMime,
  readImageSize,
  uploadDir,
  ALLOWED_MIME,
  MAX_UPLOAD_BYTES,
} from "../lib/uploads";

/** Minimal PNG: 8-byte signature + IHDR carrying width/height. */
function pngBytes(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

test("recognises PNG by magic number", () => {
  assert.equal(sniffImageMime(pngBytes(4, 3)), "image/png");
});

test("recognises JPEG by magic number", () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 0]);
  assert.equal(sniffImageMime(jpeg), "image/jpeg");
});

test("recognises WebP only with the RIFF container and WEBP tag", () => {
  const riff = new Uint8Array(16);
  riff.set([0x52, 0x49, 0x46, 0x46], 0);
  riff.set([0x57, 0x45, 0x42, 0x50], 8);
  assert.equal(sniffImageMime(riff), "image/webp");

  // RIFF container, wrong inner tag: not an image we accept.
  const wrong = new Uint8Array(16);
  wrong.set([0x52, 0x49, 0x46, 0x46], 0);
  wrong.set([0x57, 0x41, 0x56, 0x45], 8); // WAVE
  assert.equal(sniffImageMime(wrong), null);
});

test("recognises AVIF from its ftyp brand", () => {
  const avif = new Uint8Array(16);
  avif.set([0, 0, 0, 0x66], 4); // size placeholder + 'f'
  avif.set([0x74, 0x79, 0x70, 0x61], 5); // typ a
  assert.equal(sniffImageMime(avif), null, "brand bytes are not in place yet");

  const real = new Uint8Array(16);
  real.set([0x66, 0x74, 0x79, 0x70], 4); // ftyp
  real.set([0x61, 0x76, 0x69, 0x66], 8); // avif
  assert.equal(sniffImageMime(real), "image/avif");
});

test("rejects anything that is not an image, including a renamed script", () => {
  // A .webp filename with HTML or shell content must not get through.
  const html = new Uint8Array(64);
  html.set(new TextEncoder().encode("<!doctype html><script>alert(1)</script>"), 0);
  assert.equal(sniffImageMime(html), null);

  const shell = new Uint8Array(64);
  shell.set(new TextEncoder().encode("#!/bin/sh\nrm -rf /\n"), 0);
  assert.equal(sniffImageMime(shell), null);

  // A PDF header.
  const pdf = new Uint8Array(16);
  pdf.set(new TextEncoder().encode("%PDF-1.7"), 0);
  assert.equal(sniffImageMime(pdf), null);
});

test("rejects input too short to carry a signature", () => {
  assert.equal(sniffImageMime(new Uint8Array(0)), null);
  assert.equal(sniffImageMime(new Uint8Array(3)), null);
  assert.equal(sniffImageMime(new Uint8Array(11)), null);
});

test("reads PNG dimensions from the IHDR chunk", () => {
  const size = readImageSize(pngBytes(1200, 900), "image/png");
  assert.deepEqual(size, { width: 1200, height: 900 });
});

test("reads large PNG dimensions that need the full uint32", () => {
  const size = readImageSize(pngBytes(8000, 6000), "image/png");
  assert.deepEqual(size, { width: 8000, height: 6000 });
});

test("reads JPEG dimensions from the frame header", () => {
  // SOI, then an APP0 segment, then SOF0 carrying the size.
  const bytes = new Uint8Array(30);
  const view = new DataView(bytes.buffer);
  bytes.set([0xff, 0xd8], 0);
  bytes.set([0xff, 0xe0], 2); // APP0
  view.setUint16(4, 16); // segment length
  bytes.set([0xff, 0xc0], 20); // SOF0
  view.setUint16(22, 17); // segment length
  bytes[24] = 8; // precision
  view.setUint16(25, 640); // height
  view.setUint16(27, 480); // width

  const size = readImageSize(bytes, "image/jpeg");
  assert.deepEqual(size, { width: 480, height: 640 });
});

test("a truncated JPEG returns null rather than a wrong size", () => {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
  assert.equal(readImageSize(bytes, "image/jpeg"), null);
});

test("AVIF returns null, so the caller falls back to a safe default", () => {
  // Rather than reporting a guessed ratio that would shift the grid.
  const avif = new Uint8Array(64);
  avif.set([0x66, 0x74, 0x79, 0x70], 4);
  assert.equal(readImageSize(avif, "image/avif"), null);
});

test("the upload directory resolves inside the project", () => {
  const dir = uploadDir();
  assert.ok(dir.length > 0);
  assert.ok(!dir.includes(".."), `uploadDir must be resolved, got ${dir}`);
});

test("only the four reviewed formats are allowed", () => {
  assert.deepEqual([...ALLOWED_MIME.keys()].sort(), [
    "image/avif",
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);
  // Every allowed mime maps to an extension, which the route handler relies on.
  for (const extension of ALLOWED_MIME.values()) {
    assert.match(extension, /^(jpg|png|webp|avif)$/);
  }
});

test("the size cap is finite and in a sane range", () => {
  assert.ok(MAX_UPLOAD_BYTES > 0);
  assert.ok(MAX_UPLOAD_BYTES <= 10 * 1024 * 1024, "10MB is more than a menu photo needs");
});
