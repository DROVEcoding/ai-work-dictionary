# V12B Super Admin Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a read-only super admin console that lets platform admins view global users, organizations, organization owners/members, and feedback reports.

**Architecture:** Supabase RPC functions expose read-only global admin data after checking `public.is_admin()`. A new `admin.html` page uses `scripts/admin.js` for page behavior and `scripts/adminData.js` for API calls and data mapping. The existing `index.html` only shows an admin-entry link when the current platform role is `admin`.

**Tech Stack:** Static HTML/CSS, browser ES modules, Supabase JS v2, Supabase SQL RPC, Node built-in test runner.

---

### Task 1: Add Admin Data Mapping Tests

**Files:**
- Modify: `tests/logic.test.mjs`
- Create later: `scripts/adminData.js`

- [ ] **Step 1: Write failing tests for admin data mapping**

Add imports:

```js
import { formatAdminFeedbackReports, formatAdminOrganizations, formatAdminOverview, formatAdminUsers, shouldLoadAdminData } from "../scripts/adminData.js";
```

Add tests:

```js
test("后台总览数据会转换成稳定数字", () => {
  const overview = formatAdminOverview({
    user_count: 3,
    organization_count: 2,
    feedback_count: 5,
    open_feedback_count: 4
  });

  assert.deepEqual(overview, {
    userCount: 3,
    organizationCount: 2,
    feedbackCount: 5,
    openFeedbackCount: 4
  });
});

test("后台用户列表会保留平台角色和组织数量", () => {
  const users = formatAdminUsers([
    {
      id: "user-1",
      email: "admin@example.com",
      role: "admin",
      created_at: "2026-06-13T00:00:00.000Z",
      organization_count: 2
    }
  ]);

  assert.equal(users[0].id, "user-1");
  assert.equal(users[0].email, "admin@example.com");
  assert.equal(users[0].role, "admin");
  assert.equal(users[0].organizationCount, 2);
});

test("后台组织列表会展示拥有者和成员数量", () => {
  const organizations = formatAdminOrganizations([
    {
      id: "org-1",
      name: "客户成功组",
      created_at: "2026-06-13T00:00:00.000Z",
      owners: ["owner@example.com"],
      member_count: 4
    }
  ]);

  assert.equal(organizations[0].name, "客户成功组");
  assert.deepEqual(organizations[0].owners, ["owner@example.com"]);
  assert.equal(organizations[0].memberCount, 4);
});

test("后台反馈列表会展示提交人、组织和状态", () => {
  const reports = formatAdminFeedbackReports([
    {
      id: "feedback-1",
      message: "按钮没有反应",
      status: "open",
      created_at: "2026-06-13T00:00:00.000Z",
      reporter_email: "user@example.com",
      organization_name: "客户成功组"
    }
  ]);

  assert.equal(reports[0].message, "按钮没有反应");
  assert.equal(reports[0].status, "open");
  assert.equal(reports[0].reporterEmail, "user@example.com");
  assert.equal(reports[0].organizationName, "客户成功组");
});

test("只有平台管理员状态会读取后台数据", () => {
  assert.equal(shouldLoadAdminData(null), false);
  assert.equal(shouldLoadAdminData({ role: "user" }), false);
  assert.equal(shouldLoadAdminData({ role: "admin" }), true);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test`

Expected: FAIL because `scripts/adminData.js` does not exist or exports are missing.

### Task 2: Implement Admin Data Module

**Files:**
- Create: `scripts/adminData.js`
- Modify: `tests/logic.test.mjs`

- [ ] **Step 1: Create minimal module to pass mapping tests**

Create `scripts/adminData.js`:

```js
export function shouldLoadAdminData(profile) {
  return profile?.role === "admin";
}

export function formatAdminOverview(row = {}) {
  return {
    userCount: Number(row.user_count || 0),
    organizationCount: Number(row.organization_count || 0),
    feedbackCount: Number(row.feedback_count || 0),
    openFeedbackCount: Number(row.open_feedback_count || 0)
  };
}

export function formatAdminUsers(rows = []) {
  return rows.map((user) => ({
    id: user.id,
    email: user.email || "未知用户",
    role: user.role || "user",
    createdAt: user.created_at,
    organizationCount: Number(user.organization_count || 0)
  }));
}

export function formatAdminOrganizations(rows = []) {
  return rows.map((organization) => ({
    id: organization.id,
    name: organization.name || "未命名组织",
    createdAt: organization.created_at,
    owners: organization.owners || [],
    memberCount: Number(organization.member_count || 0)
  }));
}

export function formatAdminFeedbackReports(rows = []) {
  return rows.map((report) => ({
    id: report.id,
    message: report.message,
    status: report.status || "open",
    createdAt: report.created_at,
    reporterEmail: report.reporter_email || "未知用户",
    organizationName: report.organization_name || "个人空间"
  }));
}
```

- [ ] **Step 2: Add RPC loading functions**

Append to `scripts/adminData.js`:

```js
export async function loadAdminOverview(supabase) {
  const { data, error } = await supabase.rpc("get_admin_overview").single();
  if (error) {
    return { ok: false, overview: null, message: error.message };
  }

  return { ok: true, overview: formatAdminOverview(data), message: "已读取后台总览。" };
}

export async function loadAdminUsers(supabase) {
  const { data, error } = await supabase.rpc("list_admin_users");
  if (error) {
    return { ok: false, users: [], message: error.message };
  }

  return { ok: true, users: formatAdminUsers(data || []), message: "已读取用户列表。" };
}

export async function loadAdminOrganizations(supabase) {
  const { data, error } = await supabase.rpc("list_admin_organizations");
  if (error) {
    return { ok: false, organizations: [], message: error.message };
  }

  return { ok: true, organizations: formatAdminOrganizations(data || []), message: "已读取组织列表。" };
}

export async function loadAdminFeedbackReports(supabase) {
  const { data, error } = await supabase.rpc("list_admin_feedback_reports");
  if (error) {
    return { ok: false, reports: [], message: error.message };
  }

  return { ok: true, reports: formatAdminFeedbackReports(data || []), message: "已读取反馈列表。" };
}
```

- [ ] **Step 3: Run tests and verify pass**

Run: `npm test`

Expected: PASS.

### Task 3: Add Supabase Admin RPC SQL

**Files:**
- Create: `docs/v12b-super-admin-console-schema.sql`

- [ ] **Step 1: Create SQL file**

Create SQL functions:

```sql
create or replace function public.get_admin_overview()
returns table (
  user_count bigint,
  organization_count bigint,
  feedback_count bigint,
  open_feedback_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception '只有超级管理员可以读取后台总览。';
  end if;

  return query
    select
      (select count(*) from public.profiles),
      (select count(*) from public.organizations),
      (select count(*) from public.feedback_reports),
      (select count(*) from public.feedback_reports where status = 'open');
end;
$$;

create or replace function public.list_admin_users()
returns table (
  id uuid,
  email text,
  role public.app_role,
  created_at timestamptz,
  organization_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception '只有超级管理员可以读取用户列表。';
  end if;

  return query
    select
      p.id,
      p.email,
      p.role,
      p.created_at,
      count(om.organization_id) as organization_count
    from public.profiles as p
    left join public.organization_memberships as om on om.user_id = p.id
    group by p.id, p.email, p.role, p.created_at
    order by p.created_at desc;
end;
$$;

create or replace function public.list_admin_organizations()
returns table (
  id uuid,
  name text,
  created_at timestamptz,
  owners text[],
  member_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception '只有超级管理员可以读取组织列表。';
  end if;

  return query
    select
      o.id,
      o.name,
      o.created_at,
      array_remove(array_agg(p.email order by p.email) filter (where om.role = 'owner'), null) as owners,
      count(om.user_id) as member_count
    from public.organizations as o
    left join public.organization_memberships as om on om.organization_id = o.id
    left join public.profiles as p on p.id = om.user_id
    group by o.id, o.name, o.created_at
    order by o.created_at desc;
end;
$$;

create or replace function public.list_admin_feedback_reports()
returns table (
  id uuid,
  message text,
  status text,
  created_at timestamptz,
  reporter_email text,
  organization_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception '只有超级管理员可以读取反馈列表。';
  end if;

  return query
    select
      f.id,
      f.message,
      f.status,
      f.created_at,
      p.email as reporter_email,
      o.name as organization_name
    from public.feedback_reports as f
    left join public.profiles as p on p.id = f.reporter_id
    left join public.organizations as o on o.id = f.organization_id
    order by f.created_at desc
    limit 100;
end;
$$;

grant execute on function public.get_admin_overview() to authenticated;
grant execute on function public.list_admin_users() to authenticated;
grant execute on function public.list_admin_organizations() to authenticated;
grant execute on function public.list_admin_feedback_reports() to authenticated;
```

- [ ] **Step 2: Review SQL for read-only behavior**

Confirm the file contains no `insert`, `update`, or `delete`.

### Task 4: Add Admin Page and Entry Link

**Files:**
- Create: `admin.html`
- Modify: `index.html`
- Modify: `scripts/app.js`

- [ ] **Step 1: Add admin entry link to `index.html`**

Add near the auth actions:

```html
<a class="secondary-button admin-entry-link" id="adminEntryLink" href="./admin.html" hidden>进入后台管理</a>
```

- [ ] **Step 2: Wire admin entry visibility in `scripts/app.js`**

Add DOM reference:

```js
const adminEntryLink = document.querySelector("#adminEntryLink");
```

Add in `renderPermissions()`:

```js
adminEntryLink.hidden = !canManage;
```

- [ ] **Step 3: Create `admin.html`**

Create a standalone page with sections:

```html
<section id="adminGate" class="admin-gate"></section>
<section id="adminContent" class="admin-console" hidden>
  <div id="adminOverview" class="admin-overview-grid"></div>
  <section><h2>用户</h2><div id="adminUsers"></div></section>
  <section><h2>组织</h2><div id="adminOrganizations"></div></section>
  <section><h2>反馈</h2><div id="adminFeedback"></div></section>
</section>
```

Load `scripts/admin.js` as a module.

### Task 5: Implement Admin Page Behavior

**Files:**
- Create: `scripts/admin.js`
- Modify: `style.css`
- Modify: `service-worker.js`

- [ ] **Step 1: Implement admin auth gate**

Use `createSupabaseClient()`, `loadProfile()`, and `shouldLoadAdminData()`.

Behavior:
- Supabase not configured: show setup message.
- No session user: show login-required message and main-page link.
- Non-admin profile: show no-permission message.
- Admin profile: reveal content and load data.

- [ ] **Step 2: Render admin data**

Load overview, users, organizations, feedback reports with `Promise.all`.

Render:
- Overview cards.
- User rows.
- Organization rows with owners joined by `、`.
- Feedback rows with status, reporter, organization, and created time.

- [ ] **Step 3: Add CSS**

Add compact admin styles to `style.css`: admin layout, overview grid, table-like rows, status badges, empty/error states.

- [ ] **Step 4: Update service worker app shell**

Change cache name to `ai-work-dictionary-v12b` and include:

```js
"./admin.html",
"./scripts/admin.js",
"./scripts/adminData.js",
```

### Task 6: README and Verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update Chinese file purpose table**

Add:

```markdown
| `admin.html` | 超级管理员后台页面 |
| `scripts/admin.js` | 后台页面登录检查、权限判断和渲染 |
| `scripts/adminData.js` | 后台 RPC 数据读取和格式转换 |
| `docs/v12b-super-admin-console-schema.sql` | V12B 后台数据库函数 |
```

- [ ] **Step 2: Run verification**

Run:

```powershell
npm test
node --check scripts\app.js
node --check scripts\admin.js
node --check scripts\adminData.js
node --check service-worker.js
git diff --check
```

Expected: all pass.

- [ ] **Step 3: Manual browser checks**

Open:

```text
http://127.0.0.1:8784/admin.html
```

Expected:
- Non-admin users do not see global data.
- Admin users see overview, users, organizations, and feedback sections after running SQL in Supabase.

- [ ] **Step 4: Commit**

Run:

```powershell
git add admin.html index.html style.css service-worker.js scripts\app.js scripts\admin.js scripts\adminData.js tests\logic.test.mjs README.md docs\v12b-super-admin-console-schema.sql
git commit -m "Add V12B super admin console"
```
