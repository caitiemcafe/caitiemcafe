import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from './app.js';
import { signAdminToken } from './utils/auth.js';

describe('health endpoint', () => {
  it('trả trạng thái ok mà không cần truy cập database', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
  });
});

describe('admin protection', () => {
  it('từ chối API admin khi thiếu token', async () => {
    const response = await request(app).get('/api/admin/dashboard');
    expect(response.status).toBe(401);
  });

  it('từ chối upload không phải ảnh với token hợp lệ', async () => {
    const token = signAdminToken({ sub: 1, username: 'admin', role: 'admin' });
    const response = await request(app).post('/api/admin/upload').set('Authorization', `Bearer ${token}`).attach('image', Buffer.from('not-an-image'), { filename: 'payload.txt', contentType: 'text/plain' });
    expect(response.status).toBe(422);
  });

  it('từ chối ảnh vượt quá 5 MB', async () => {
    const token = signAdminToken({ sub: 1, username: 'admin', role: 'admin' });
    const response = await request(app).post('/api/admin/upload').set('Authorization', `Bearer ${token}`).attach('image', Buffer.alloc(5 * 1024 * 1024 + 1), { filename: 'large.png', contentType: 'image/png' });
    expect(response.status).toBe(413);
  });
});
