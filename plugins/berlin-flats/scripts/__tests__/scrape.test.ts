import { afterEach, describe, expect, test } from "bun:test";
import { jinaHeaders } from "../scrape.ts";

describe("jinaHeaders", () => {
  const ORIGINAL = process.env.JINA_API_KEY;
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.JINA_API_KEY;
    else process.env.JINA_API_KEY = ORIGINAL;
  });

  test("omits Authorization header when no key is set", () => {
    delete process.env.JINA_API_KEY;
    expect(jinaHeaders().Authorization).toBeUndefined();
  });

  test("adds a Bearer Authorization header when JINA_API_KEY is set", () => {
    process.env.JINA_API_KEY = "test-key-123";
    expect(jinaHeaders().Authorization).toBe("Bearer test-key-123");
  });

  test("always includes the base Jina headers", () => {
    delete process.env.JINA_API_KEY;
    const headers = jinaHeaders();
    expect(headers['X-Return-Format']).toBe('html');
    expect(headers['Accept']).toBe('text/html,text/plain');
  });
});
