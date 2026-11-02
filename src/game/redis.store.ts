import { Injectable } from '@nestjs/common';
import { connect as connectNet, Socket } from 'node:net';
import { connect as connectTls, TLSSocket } from 'node:tls';

/** Minimal RESP client to keep the app dependency-free. Uses REDIS_URL (redis:// or rediss://). */
@Injectable()
export class RedisStore {
  private readonly url = process.env.REDIS_URL;
  private readonly ttlSeconds = Number(process.env.GAME_TTL_SECONDS || 60 * 60 * 24);

  async get(key: string): Promise<string | null> {
    if (!this.url) return null;
    return this.command(['GET', key]);
  }

  async set(key: string, value: string): Promise<void> {
    if (!this.url) return;
    await this.command(['SET', key, value, 'EX', String(this.ttlSeconds)]);
  }


  private async command(args: string[]): Promise<string | null> {
    const url = new URL(this.url!);
    if (!['redis:', 'rediss:'].includes(url.protocol)) throw new Error('REDIS_URL 必须使用 redis:// 或 rediss://');
    const port = Number(url.port || 6379);
    const socket: Socket | TLSSocket = await new Promise((resolve, reject) => {
      const s = url.protocol === 'rediss:'
        ? connectTls({ host: url.hostname, port, servername: url.hostname }, () => resolve(s))
        : connectNet({ host: url.hostname, port }, () => resolve(s));
      s.setTimeout(5000, () => s.destroy(new Error('Redis 连接超时')));
      s.once('error', reject);
    });
    try {
      const user = decodeURIComponent(url.username || '');
      const pass = decodeURIComponent(url.password || '');
      if (!pass) throw new Error('REDIS_URL 缺少密码或 token');
      await this.exchange(socket, user ? ['AUTH', user, pass] : ['AUTH', pass]);
      const db = url.pathname.replace(/^\//, '');
      if (db && db !== '0') await this.exchange(socket, ['SELECT', db]);
      return await this.exchange(socket, args);
    } finally {
      socket.destroy();
    }
  }

  private exchange(socket: Socket | TLSSocket, args: string[]): Promise<string | null> {
    const frame = `*${args.length}\r\n${args.map(a => `$${Buffer.byteLength(a)}\r\n${a}\r\n`).join('')}`;
    return new Promise((resolve, reject) => {
      let buffer = Buffer.alloc(0);
      const cleanup = () => { socket.off('data', onData); socket.off('error', onError); };
      const onError = (error: Error) => { cleanup(); reject(error); };
      const onData = (chunk: Buffer) => {
        buffer = Buffer.concat([buffer, chunk]);
        const parsed = this.parse(buffer, 0);
        if (!parsed || parsed.next > buffer.length) return;
        cleanup();
        if (parsed.error) reject(new Error(parsed.value)); else resolve(parsed.value);
      };
      socket.on('data', onData);
      socket.once('error', onError);
      socket.write(frame);
    });
  }

  private parse(buffer: Buffer, start: number): { value: string | null; next: number; error?: boolean } | null {
    if (start >= buffer.length) return null;
    const type = String.fromCharCode(buffer[start]);
    const end = buffer.indexOf('\r\n', start);
    if (end < 0) return null;
    const head = buffer.toString('utf8', start + 1, end);
    if (type === '+' || type === '-') return { value: head, next: end + 2, error: type === '-' };
    if (type === ':') return { value: head, next: end + 2 };
    if (type === '$') {
      const length = Number(head);
      if (length < 0) return { value: null, next: end + 2 };
      const bodyEnd = end + 2 + length;
      if (buffer.length < bodyEnd + 2) return null;
      return { value: buffer.toString('utf8', end + 2, bodyEnd), next: bodyEnd + 2 };
    }
    return { value: null, next: end + 2, error: true };
  }
}
