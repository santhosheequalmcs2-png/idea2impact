import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from './app.js';
import http from 'http';

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('Health check endpoint returns ok', async () => {
  const res = await fetch(`${baseUrl}/health`);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.status, 'ok');
  assert.equal(data.service, 'idea2impact-api');
});

test('Categories endpoint returns list of categories', async () => {
  const res = await fetch(`${baseUrl}/categories`);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(data.categories));
  assert.ok(data.categories.length >= 8);
  assert.ok(data.categories.some(c => c.name === 'Inventions'));
});

test('Browse innovations returns list with authors and categories', async () => {
  const res = await fetch(`${baseUrl}/innovations`);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(data.items));
  assert.ok(data.items.length > 0);
  
  const first = data.items[0];
  assert.ok(first.id);
  assert.ok(first.title);
  assert.ok(first.category);
  assert.ok(typeof first.likeCount === 'number');
  assert.ok(typeof first.commentCount === 'number');
});

test('User registration and login lifecycle', async () => {
  const unique = Date.now();
  const testEmail = `tester_${unique}@example.com`;
  const testPassword = 'Password123!';
  const testName = `Innovator Test ${unique}`;

  // 1. Register
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      password: testPassword,
      role: 'Creator'
    })
  });
  const regData = await regRes.json();
  assert.equal(regRes.status, 201, `Registration failed: ${regData.error}`);
  assert.ok(regData.token, 'Token returned');
  assert.equal(regData.user.email, testEmail);
  const token = regData.token;

  // 2. Duplicate registration fails with 409
  const dupRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      password: testPassword,
      role: 'Creator'
    })
  });
  assert.equal(dupRes.status, 409);

  // 3. Login
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword
    })
  });
  const loginData = await loginRes.json();
  assert.equal(loginRes.status, 200);
  assert.ok(loginData.token);
  assert.equal(loginData.user.name, testName);

  // 4. Verify auth with /auth/me
  const meRes = await fetch(`${baseUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const meData = await meRes.json();
  assert.equal(meRes.status, 200);
  assert.equal(meData.user.email, testEmail);

  // 5. Update user profile
  const profileRes = await fetch(`${baseUrl}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      headline: 'Senior Robotics Engineer',
      bio: 'Building autonomous aerial vehicles and sensor systems.',
      skills: ['Robotics', 'Python', 'ROS2', 'Computer Vision'],
      location: 'Boston, MA'
    })
  });
  const profileData = await profileRes.json();
  assert.equal(profileRes.status, 200);
  assert.equal(profileData.user.profile.headline, 'Senior Robotics Engineer');
  assert.equal(profileData.user.profile.location, 'Boston, MA');

  // 6. Create innovation
  const createRes = await fetch(`${baseUrl}/innovations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'AeroGlide Solar Drone',
      description: 'An ultra-lightweight autonomous drone equipped with high-efficiency solar cells for multi-day continuous environmental monitoring.',
      category: 'Inventions',
      price: 450,
      licensing: true,
      funding: true,
      imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80',
      visibility: 'PUBLIC'
    })
  });
  const createData = await createRes.json();
  assert.equal(createRes.status, 201, `Creation failed: ${createData.error}`);
  assert.ok(createData.item.id);
  const ideaId = createData.item.id;

  // 7. Get single innovation detail
  const detailRes = await fetch(`${baseUrl}/innovations/${ideaId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const detailData = await detailRes.json();
  assert.equal(detailRes.status, 200);
  assert.equal(detailData.item.title, 'AeroGlide Solar Drone');
  assert.equal(detailData.item.price, 450);

  // 8. Like the innovation
  const likeRes = await fetch(`${baseUrl}/innovations/${ideaId}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const likeData = await likeRes.json();
  assert.equal(likeRes.status, 200);
  assert.equal(likeData.liked, true);
  assert.equal(likeData.likeCount, 1);

  // 9. Post a comment on the innovation
  const commentRes = await fetch(`${baseUrl}/innovations/${ideaId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      body: 'This solar drone concept has huge potential for forestry and wildfire detection!'
    })
  });
  const commentData = await commentRes.json();
  assert.equal(commentRes.status, 201);
  assert.ok(commentData.comment.id);
  assert.equal(commentData.comment.author.name, testName);

  // 10. Dashboard stats
  const dashRes = await fetch(`${baseUrl}/dashboard/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const dashData = await dashRes.json();
  assert.equal(dashRes.status, 200);
  assert.ok(dashData.stats.myInnovationsCount >= 1);
  assert.ok(dashData.stats.totalLikesReceived >= 1);
  assert.ok(dashData.stats.totalCommentsReceived >= 1);

  // 11. Edit own innovation
  const editRes = await fetch(`${baseUrl}/innovations/${ideaId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'AeroGlide Solar Drone v2 (Updated)',
      price: 499
    })
  });
  const editData = await editRes.json();
  assert.equal(editRes.status, 200);
  assert.equal(editData.item.title, 'AeroGlide Solar Drone v2 (Updated)');
  assert.equal(editData.item.price, 499);

  // 12. Delete own innovation
  const delRes = await fetch(`${baseUrl}/innovations/${ideaId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const delData = await delRes.json();
  assert.equal(delRes.status, 200);
  assert.equal(delData.ok, true);

  // Verify it is gone
  const checkRes = await fetch(`${baseUrl}/innovations/${ideaId}`);
  assert.equal(checkRes.status, 404);
});
