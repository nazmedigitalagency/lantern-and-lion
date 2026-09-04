import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';

async function runLiveCheck() {
  console.log(`Starting live connection verification against ${BASE_URL}...`);

  // 1. Check Root & Core Dashboards
  const pages = [
    '/teacher-dashboard',
    '/parent-dashboard',
    '/child-dashboard',
    '/teen-dashboard',
  ];

  for (const page of pages) {
    const res = await fetch(`${BASE_URL}${page}`);
    console.log(`[PAGE] ${page} -> HTTP ${res.status}`);
    assert.equal(res.status, 200, `${page} should return HTTP 200`);
    const html = await res.text();
    assert.ok(html.length > 500, `${page} should return valid HTML`);
  }

  // 2. Check Teacher Student Lookup API (Enforces Teacher Auth)
  const lookupRes = await fetch(`${BASE_URL}/api/teacher/students/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teacherCode: 'AMARA-4821',
      classroomId: '00000000-0000-0000-0000-000000000000',
    }),
  });
  console.log(`[API] /api/teacher/students/lookup -> HTTP ${lookupRes.status}`);
  // Unauthenticated teacher must be rejected with 401
  assert.equal(lookupRes.status, 401);
  const lookupJson = await lookupRes.json();
  assert.equal(lookupJson.error, 'Please sign in as a teacher first.');

  // 3. Check Teacher Students API (Enforces Teacher Auth)
  const studentsRes = await fetch(`${BASE_URL}/api/teacher/students?classroomId=00000000-0000-0000-0000-000000000000`);
  console.log(`[API] /api/teacher/students (GET) -> HTTP ${studentsRes.status}`);
  assert.equal(studentsRes.status, 401);

  // 4. Check Family Classrooms API (Enforces Parent Auth)
  const familyRes = await fetch(`${BASE_URL}/api/family/classrooms`);
  console.log(`[API] /api/family/classrooms -> HTTP ${familyRes.status}`);
  assert.equal(familyRes.status, 401);

  // 5. Check Child Classroom API
  const childRes = await fetch(`${BASE_URL}/api/child/classroom`);
  console.log(`[API] /api/child/classroom -> HTTP ${childRes.status}`);
  // Returns 401 or null connection when unauthenticated
  assert.ok([200, 401].includes(childRes.status));

  // 6. Check Classroom Approve API (Enforces Parent Auth)
  const approveRes = await fetch(`${BASE_URL}/api/classrooms/00000000-0000-0000-0000-000000000000/students/child-1/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approve' }),
  });
  console.log(`[API] /api/classrooms/.../approve (PATCH) -> HTTP ${approveRes.status}`);
  assert.equal(approveRes.status, 401);

  console.log('\nAll live HTTP endpoints and security boundaries verified successfully!');
}

runLiveCheck().catch((err) => {
  console.error('Live check failed:', err);
  process.exit(1);
});
