'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Divider,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import PercentOutlinedIcon from '@mui/icons-material/PercentOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';

import {
  useAdminStatsData,
  useStatsRanges,
  computeAdminStats,
} from '@/hooks/useAdminStats';
import { StatusPill } from '@/components/common/AdminDataTable';

const BRAND = '#5A41D8';
const INK = '#1E1442';
const DEPARTMENTS = ['ECE', 'CISE', 'MAE'];

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
  accent?: string;
  onClick?: () => void;
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  accent = BRAND,
  onClick,
}: KpiCardProps) {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 2.5,
        borderRadius: 3,
        minWidth: 220,
        flex: '1 1 220px',
        background: `linear-gradient(180deg, #ffffff 0%, ${accent}08 100%)`,
        borderColor: '#E5E7EB',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        '&:hover': onClick
          ? {
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 18px -10px rgba(0,0,0,0.2)',
            }
          : undefined,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${accent}14`,
            color: accent,
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
          {label}
        </Typography>
      </Stack>
      <Typography
        sx={{
          mt: 1.5,
          fontSize: 32,
          fontWeight: 700,
          lineHeight: 1.1,
          color: INK,
        }}
      >
        {value}
      </Typography>
      {hint && (
        <Typography sx={{ mt: 0.5, fontSize: 12, color: '#6B7280' }}>
          {hint}
        </Typography>
      )}
    </Paper>
  );
}

interface BreakdownCardProps {
  title: string;
  items: Array<{ key: string; count: number }>;
  emptyLabel?: string;
  total?: number;
  renderValue?: (count: number) => React.ReactNode;
}

function BreakdownCard({
  title,
  items,
  emptyLabel,
  total,
  renderValue,
}: BreakdownCardProps) {
  const max = Math.max(...items.map((i) => i.count), 1);
  const effectiveTotal =
    total ?? (items.reduce((sum, i) => sum + i.count, 0) || 0);
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        flex: '1 1 320px',
        borderColor: '#E5E7EB',
      }}
    >
      <Typography
        sx={{ fontSize: 13, color: '#6B7280', fontWeight: 600, mb: 2 }}
      >
        {title}
      </Typography>
      {items.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: '#9CA3AF' }}>
          {emptyLabel || 'No data in this range.'}
        </Typography>
      ) : (
        <Stack spacing={1.25}>
          {items.slice(0, 6).map((item) => {
            const pct = Math.round((item.count / max) * 100);
            const share =
              effectiveTotal > 0
                ? Math.round((item.count / effectiveTotal) * 100)
                : 0;
            return (
              <Box key={item.key}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 0.5 }}
                >
                  <Typography
                    sx={{ fontSize: 13, color: INK, fontWeight: 500 }}
                  >
                    {prettyKey(item.key)}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}
                  >
                    {renderValue ? renderValue(item.count) : item.count}
                    {!renderValue && effectiveTotal > 0 && (
                      <span style={{ color: '#9CA3AF' }}> · {share}%</span>
                    )}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: '#F3F4F6',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 999,
                      backgroundColor: BRAND,
                    },
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}

function prettyKey(key: string) {
  if (!key) return '—';
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatWhen(d?: Date | null) {
  if (!d) return '—';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function Sparkline({
  data,
  height = 80,
  accent = BRAND,
}: {
  data: Array<{ label: string; count: number; iso: string }>;
  height?: number;
  accent?: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const barWidth = 100 / Math.max(data.length, 1);
  return (
    <Box sx={{ width: '100%', height, position: 'relative' }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
      >
        {data.map((d, i) => {
          const h = (d.count / max) * (height - 16);
          const x = i * barWidth + barWidth * 0.15;
          const y = height - h - 8;
          const w = barWidth * 0.7;
          return (
            <g key={d.iso}>
              <rect
                x={x}
                y={y}
                width={w}
                height={Math.max(h, 1)}
                rx={0.5}
                fill={accent}
                opacity={d.count === 0 ? 0.15 : 0.85}
              >
                <title>{`${d.label}: ${d.count}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      <Stack
        direction="row"
        justifyContent="space-between"
        sx={{ mt: 0.5, fontSize: 10, color: '#9CA3AF' }}
      >
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </Stack>
    </Box>
  );
}

export default function AdminStats() {
  const {
    applications,
    users,
    logins,
    bugs,
    assignments,
    courses,
    semesters,
    loading,
  } = useAdminStatsData();
  const ranges = useStatsRanges();
  const [rangeKey, setRangeKey] = React.useState<string>('30d');
  const [department, setDepartment] = React.useState<string>('all');
  const [semester, setSemester] = React.useState<string>('all');

  const stats = React.useMemo(() => {
    return computeAdminStats({
      applications,
      users,
      logins,
      bugs,
      assignments,
      courses,
      rangeStart: ranges[rangeKey].start,
      department: department === 'all' ? null : department,
      semester: semester === 'all' ? null : semester,
    });
  }, [
    applications,
    users,
    logins,
    bugs,
    assignments,
    courses,
    ranges,
    rangeKey,
    department,
    semester,
  ]);

  const exportCsv = () => {
    const rows: Array<[string, string | number]> = [
      ['Metric', 'Value'],
      ['Range', ranges[rangeKey].label],
      ['Department', department === 'all' ? 'All' : department],
      ['Semester', semester === 'all' ? 'All' : semester],
      ['Unique logins (range)', stats.uniqueLogins],
      ['Total login sessions (range)', stats.totalLogins],
      ['Applications submitted (range)', stats.submitted],
      ['Applications approved (range)', stats.approved],
      ['Applications denied (range)', stats.denied],
      ['Applications pending (range)', stats.pending],
      ['Approval rate (range)', `${stats.approvalRate}%`],
      ['Total applications (filtered)', stats.totalApplications],
      ['Total approved (all-time)', stats.totalApproved],
      ['Total pending (all-time)', stats.totalPending],
      ['Total denied (all-time)', stats.totalDenied],
      ['Total users', stats.totalUsers],
      ['Unapproved faculty', stats.unapprovedFaculty],
      ['Bugs reported (range)', stats.bugsInRange],
      ['Bugs high', stats.bugsBySeverity.high],
      ['Bugs medium', stats.bugsBySeverity.medium],
      ['Bugs low', stats.bugsBySeverity.low],
      ['Assignments (filtered)', stats.totalAssignments],
      ['Assignments (range)', stats.assignmentsInRange],
      ['Hours assigned (filtered)', stats.hoursTotal],
      ['Hours assigned (range)', stats.hoursInRange],
      ['Avg hours per assignment', stats.avgHoursPerAssignment],
      ['Courses (filtered)', stats.totalCourses],
      ['Courses staffed', stats.coursesWithStaff],
      ['Staffing coverage', `${stats.staffingCoverage}%`],
      ['Unassigned approved applicants', stats.unassignedApproved.length],
    ];
    const csv = rows
      .map(([k, v]) =>
        [k, String(v)].map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `courseconnect-admin-stats-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ pb: 10 }}>
      {/* Filters row */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          borderColor: '#E5E7EB',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Box>
            <Typography sx={{ fontSize: 11, color: '#6B7280', mb: 0.25 }}>
              Time range
            </Typography>
            <ToggleButtonGroup
              value={rangeKey}
              exclusive
              size="small"
              onChange={(_, v) => v && setRangeKey(v)}
              sx={{
                '& .MuiToggleButton-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 1.5,
                  borderColor: '#E5E7EB',
                  color: '#374151',
                  '&.Mui-selected': {
                    backgroundColor: `${BRAND}14`,
                    color: BRAND,
                    borderColor: BRAND,
                  },
                },
              }}
            >
              {Object.entries(ranges).map(([k, v]) => (
                <ToggleButton key={k} value={k}>
                  {v.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, color: '#6B7280', mb: 0.25 }}>
              Department
            </Typography>
            <Select
              size="small"
              value={department}
              onChange={(e) => setDepartment(e.target.value as string)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="all">All departments</MenuItem>
              {DEPARTMENTS.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, color: '#6B7280', mb: 0.25 }}>
              Semester
            </Typography>
            <Select
              size="small"
              value={semester}
              onChange={(e) => setSemester(e.target.value as string)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">All semesters</MenuItem>
              {semesters.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </Box>
          {loading && (
            <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>
              Syncing live data…
            </Typography>
          )}
        </Stack>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={exportCsv}
          sx={{
            textTransform: 'none',
            borderColor: BRAND,
            color: BRAND,
            '&:hover': { borderColor: BRAND, backgroundColor: `${BRAND}0A` },
          }}
        >
          Export CSV
        </Button>
      </Paper>

      {/* Top KPIs */}
      <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <KpiCard
          icon={<LoginOutlinedIcon fontSize="small" />}
          label="Users logged in"
          value={stats.uniqueLogins}
          hint={`${stats.totalLogins} total sessions`}
          accent="#0EA5E9"
        />
        <KpiCard
          icon={<DescriptionOutlinedIcon fontSize="small" />}
          label="Applications submitted"
          value={stats.submitted}
          hint={`${stats.totalApplications} all-time (filtered)`}
          accent={BRAND}
        />
        <KpiCard
          icon={<CheckCircleOutlineOutlinedIcon fontSize="small" />}
          label="Approved"
          value={stats.approved}
          hint={`${stats.approvalRate}% approval rate`}
          accent="#10B981"
        />
        <KpiCard
          icon={<CancelOutlinedIcon fontSize="small" />}
          label="Denied"
          value={stats.denied}
          hint={`${stats.totalDenied} all-time (filtered)`}
          accent="#EF4444"
        />
      </Stack>

      <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <KpiCard
          icon={<PendingOutlinedIcon fontSize="small" />}
          label="Pending review"
          value={stats.totalPending}
          hint="Awaiting admin decision"
          accent="#F59E0B"
        />
        <KpiCard
          icon={<HowToRegOutlinedIcon fontSize="small" />}
          label="Unapproved faculty"
          value={stats.unapprovedFaculty}
          hint="Faculty awaiting admin approval"
          accent="#9333EA"
          onClick={() =>
            typeof window !== 'undefined' && window.location.assign('/users')
          }
        />
        <KpiCard
          icon={<AssignmentIndOutlinedIcon fontSize="small" />}
          label="Hours assigned"
          value={stats.hoursTotal}
          hint={`${stats.hoursInRange} hrs assigned in range · avg ${stats.avgHoursPerAssignment}/assignment`}
          accent="#0F766E"
        />
        <KpiCard
          icon={<SchoolOutlinedIcon fontSize="small" />}
          label="Courses staffed"
          value={`${stats.coursesWithStaff}/${stats.totalCourses}`}
          hint={`${stats.staffingCoverage}% coverage${
            semester === 'all' ? ' (pick a semester to narrow)' : ''
          }`}
          accent="#2563EB"
        />
      </Stack>

      <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap', mb: 4 }}>
        <KpiCard
          icon={<PeopleAltOutlinedIcon fontSize="small" />}
          label="Total users"
          value={stats.totalUsers}
          hint={`${stats.newUsersInRange} active in range`}
          accent="#6366F1"
        />
        <KpiCard
          icon={<BugReportOutlinedIcon fontSize="small" />}
          label="Bugs reported"
          value={stats.bugsInRange}
          hint={`${stats.bugsBySeverity.high} high · ${stats.bugsBySeverity.medium} med · ${stats.bugsBySeverity.low} low`}
          accent="#DC2626"
        />
        <KpiCard
          icon={<PercentOutlinedIcon fontSize="small" />}
          label="Approval rate"
          value={`${stats.approvalRate}%`}
          hint={`${stats.approved} of ${stats.approved + stats.denied} decided`}
          accent="#059669"
        />
        <KpiCard
          icon={<AccessTimeOutlinedIcon fontSize="small" />}
          label="Assignments (range)"
          value={stats.assignmentsInRange}
          hint={`${stats.totalAssignments} total (filtered)`}
          accent="#B45309"
        />
      </Stack>

      {/* Trend + Funnel */}
      <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 3,
            flex: '2 1 480px',
            borderColor: '#E5E7EB',
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography
              sx={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}
            >
              Submissions — last 30 days
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>
              Hover a bar for the daily count
            </Typography>
          </Stack>
          <Sparkline data={stats.daily} height={90} />
        </Paper>
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 3,
            flex: '1 1 320px',
            borderColor: '#E5E7EB',
          }}
        >
          <Typography
            sx={{ fontSize: 13, color: '#6B7280', fontWeight: 600, mb: 2 }}
          >
            Conversion funnel (filtered)
          </Typography>
          <FunnelRow
            label="Submitted"
            value={stats.funnel.submitted}
            max={stats.funnel.submitted}
            color="#6366F1"
          />
          <FunnelRow
            label="Approved"
            value={stats.funnel.adminApproved}
            max={stats.funnel.submitted}
            color="#10B981"
            parent={stats.funnel.submitted}
          />
          <FunnelRow
            label="Assigned to course"
            value={stats.funnel.assigned}
            max={stats.funnel.submitted}
            color="#0F766E"
            parent={stats.funnel.adminApproved}
          />
        </Paper>
      </Stack>

      {/* Breakdowns */}
      <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <BreakdownCard
          title="Applications by department"
          items={stats.byDepartment}
          total={stats.submitted}
        />
        <BreakdownCard
          title="Applications by position"
          items={stats.byPosition}
          total={stats.submitted}
        />
        <BreakdownCard
          title="Applicants by degree"
          items={stats.byDegree}
          total={stats.submitted}
        />
      </Stack>

      <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <BreakdownCard
          title="Hours assigned by department"
          items={stats.hoursByDept}
          total={stats.hoursTotal}
          renderValue={(n) => (
            <span>
              {n} <span style={{ color: '#9CA3AF' }}>hrs</span>
            </span>
          )}
        />
        <BreakdownCard
          title="Users by role"
          items={stats.byRole}
          total={stats.totalUsers}
        />
        {/* Pipeline card */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 3,
            flex: '1 1 320px',
            borderColor: '#E5E7EB',
          }}
        >
          <Typography
            sx={{ fontSize: 13, color: '#6B7280', fontWeight: 600, mb: 2 }}
          >
            Application pipeline (filtered)
          </Typography>
          <Stack spacing={1.5}>
            <PipelineRow
              tone="warning"
              label="Pending"
              value={stats.totalPending}
              total={stats.totalApplications}
            />
            <PipelineRow
              tone="success"
              label="Approved"
              value={stats.totalApproved}
              total={stats.totalApplications}
            />
            <PipelineRow
              tone="danger"
              label="Denied"
              value={stats.totalDenied}
              total={stats.totalApplications}
            />
          </Stack>
        </Paper>
      </Stack>

      {/* Unassigned approved + Recent bugs */}
      <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 3,
            flex: '2 1 480px',
            borderColor: '#E5E7EB',
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography
              sx={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}
            >
              Approved but not yet assigned
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>
              {stats.unassignedApproved.length} waiting · jump into{' '}
              <Box
                component="a"
                href="/admin-applications"
                sx={{ color: BRAND, textDecoration: 'none', fontWeight: 500 }}
              >
                Applications
              </Box>
            </Typography>
          </Stack>
          {stats.unassignedApproved.length === 0 ? (
            <Typography sx={{ fontSize: 13, color: '#9CA3AF' }}>
              All approved applicants are assigned. Nice.
            </Typography>
          ) : (
            <Stack spacing={1.25} divider={<Divider flexItem />}>
              {stats.unassignedApproved.slice(0, 8).map((a) => (
                <Stack
                  key={a.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: 13,
                        color: INK,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {`${a.firstname ?? ''} ${a.lastname ?? ''}`.trim() ||
                        a.email ||
                        a.id}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#6B7280' }}>
                      {a.department || 'Unknown dept'} ·{' '}
                      {a.position || 'Unknown position'}
                      {a.email ? ` · ${a.email}` : ''}
                    </Typography>
                  </Box>
                  <StatusPill label="Approved" tone="success" />
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 3,
            flex: '1 1 320px',
            borderColor: '#E5E7EB',
          }}
        >
          <Typography
            sx={{ fontSize: 13, color: '#6B7280', fontWeight: 600, mb: 2 }}
          >
            Recent bug reports
          </Typography>
          {stats.recentBugs.length === 0 ? (
            <Typography sx={{ fontSize: 13, color: '#9CA3AF' }}>
              No bugs reported in this range.
            </Typography>
          ) : (
            <Stack spacing={1.25} divider={<Divider flexItem />}>
              {stats.recentBugs.map((b) => {
                const when =
                  b.timestamp &&
                  typeof (b.timestamp as any).toDate === 'function'
                    ? (b.timestamp as any).toDate()
                    : null;
                const tone =
                  b.severity === 'high'
                    ? 'danger'
                    : b.severity === 'low'
                    ? 'neutral'
                    : 'warning';
                return (
                  <Stack
                    key={b.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 13,
                          color: INK,
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {b.summary || 'Untitled bug'}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: '#6B7280' }}>
                        {b.email || 'anonymous'} · {formatWhen(when)}
                      </Typography>
                    </Box>
                    <StatusPill
                      label={prettyKey(b.severity || 'medium')}
                      tone={tone as any}
                      size="sm"
                    />
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Paper>
      </Stack>

      {/* Staffing gaps */}
      {semester !== 'all' && (
        <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 3,
              flex: '1 1 100%',
              borderColor: '#E5E7EB',
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography
                sx={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}
              >
                Courses without an assigned TA — {semester}
                {department !== 'all' ? ` · ${department}` : ''}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>
                {stats.coursesWithoutStaffList.length} unstaffed of{' '}
                {stats.totalCourses} total
              </Typography>
            </Stack>
            {stats.coursesWithoutStaffList.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: '#10B981' }}>
                Every course in this scope has at least one assigned TA. ✓
              </Typography>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  maxHeight: 160,
                  overflowY: 'auto',
                }}
              >
                {stats.coursesWithoutStaffList.slice(0, 60).map((c) => (
                  <Tooltip
                    key={c.id}
                    title={`${c.code || c.id} · ${c.department || 'dept?'}`}
                  >
                    <Box
                      sx={{
                        px: 1.25,
                        py: 0.5,
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#92400E',
                        backgroundColor: '#FFFBEB',
                        border: '1px solid #FDE68A',
                      }}
                    >
                      {c.code || c.id}
                    </Box>
                  </Tooltip>
                ))}
                {stats.coursesWithoutStaffList.length > 60 && (
                  <Typography sx={{ fontSize: 12, color: '#6B7280' }}>
                    +{stats.coursesWithoutStaffList.length - 60} more
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Stack>
      )}
    </Box>
  );
}

function FunnelRow({
  label,
  value,
  max,
  color,
  parent,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  parent?: number;
}) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  const parentPct =
    parent === undefined || parent === 0
      ? null
      : Math.round((value / parent) * 100);
  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 0.5 }}
      >
        <Typography sx={{ fontSize: 13, color: INK, fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>
          {value}
          {parentPct !== null && (
            <span style={{ color: '#9CA3AF' }}> · {parentPct}% of prev</span>
          )}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 10,
          borderRadius: 999,
          backgroundColor: '#F3F4F6',
          '& .MuiLinearProgress-bar': {
            borderRadius: 999,
            backgroundColor: color,
          },
        }}
      />
    </Box>
  );
}

function PipelineRow({
  tone,
  label,
  value,
  total,
}: {
  tone: 'warning' | 'success' | 'danger';
  label: string;
  value: number;
  total: number;
}) {
  const color =
    tone === 'success' ? '#10B981' : tone === 'danger' ? '#EF4444' : '#F59E0B';
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 0.5 }}
      >
        <Typography sx={{ fontSize: 13, color: INK, fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>
          {value} <span style={{ color: '#9CA3AF' }}>· {pct}%</span>
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 6,
          borderRadius: 999,
          backgroundColor: '#F3F4F6',
          '& .MuiLinearProgress-bar': {
            borderRadius: 999,
            backgroundColor: color,
          },
        }}
      />
    </Box>
  );
}
