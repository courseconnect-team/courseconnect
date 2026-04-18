'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import { Role } from '@/types/User';
import { useTour } from '@/contexts/TourContext';
import { useAuth } from '@/firebase/auth/auth_context';
import {
  HELP_GUIDES,
  HELP_ROLE_ORDER,
  HelpGuide,
  HelpRoleKey,
  HelpSection,
} from './content';

const roleToKey = (role: Role | string | undefined): HelpRoleKey => {
  switch (role) {
    case 'faculty':
      return 'faculty';
    case 'admin':
      return 'admin';
    default:
      return 'student';
  }
};

const visibleRolesFor = (key: HelpRoleKey): HelpRoleKey[] => {
  switch (key) {
    case 'admin':
      return HELP_ROLE_ORDER;
    case 'faculty':
      return ['student', 'faculty'];
    default:
      return ['student'];
  }
};

type HelpViewProps = {
  role: Role | string | undefined;
};

const HelpView: React.FC<HelpViewProps> = ({ role }) => {
  const defaultKey = useMemo(() => roleToKey(role), [role]);
  const visibleRoles = useMemo(() => visibleRolesFor(defaultKey), [defaultKey]);
  const [activeKey, setActiveKey] = useState<HelpRoleKey>(defaultKey);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [bugOpen, setBugOpen] = useState(false);
  const { start } = useTour();

  const guide: HelpGuide = HELP_GUIDES[activeKey];
  const activeIndex = Math.max(0, visibleRoles.indexOf(activeKey));

  return (
    <div className="pb-16">
      {/* Intro card */}
      <div className="rounded-2xl border border-[#E7E1F7] bg-gradient-to-br from-[#F7F4FF] to-white p-6 md:p-8 mb-8 shadow-[0_1px_0_rgba(45,15,131,0.04)]">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#5A41D8] text-white flex items-center justify-center shrink-0">
            <HelpOutlineOutlinedIcon />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#6C37D8] uppercase">
              Help Center
            </p>
            <h2 className="text-2xl md:text-[28px] font-semibold text-[#1E1442] mt-1">
              Get up to speed with CourseConnect
            </h2>
            <p className="mt-2 text-sm md:text-[15px] text-[#4A3F6B] leading-relaxed max-w-3xl">
              {visibleRoles.length > 1
                ? 'Pick your role below to see step-by-step instructions for every feature you use. Your own role is selected by default — switch tabs any time to see what the other roles experience.'
                : 'Step-by-step instructions for every feature you use in CourseConnect.'}
            </p>
          </div>
        </div>
      </div>

      {/* Walkthrough CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-[#2d0f83] via-[#5A41D8] to-[#6C37D8] text-white p-6 md:p-7 mb-8 shadow-[0_20px_45px_-20px_rgba(45,15,131,0.55)] flex flex-col md:flex-row md:items-center gap-5">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
          <AutoAwesomeOutlinedIcon sx={{ fontSize: 26 }} />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/80">
            Interactive tour
          </p>
          <h3 className="text-[19px] md:text-[21px] font-semibold mt-0.5">
            Take a 60-second walkthrough of CourseConnect
          </h3>
          <p className="text-sm text-white/85 mt-1.5 leading-relaxed max-w-2xl">
            Guided tooltips spotlight the most important features for your role:
            where to apply, where to review, and where to find every update.
            Press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-xs font-mono">
              Esc
            </kbd>{' '}
            any time to exit.
          </p>
        </div>
        <button
          type="button"
          onClick={() => start(defaultKey)}
          className="shrink-0 inline-flex items-center justify-center gap-2 bg-white text-[#2d0f83] hover:bg-[#F4F1FC] font-semibold px-5 py-2.5 rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition-colors"
        >
          <PlayArrowRoundedIcon sx={{ fontSize: 20 }} />
          Start walkthrough
        </button>
      </div>

      {/* Bug report CTA */}
      <div className="rounded-2xl border border-[#F3D9D5] bg-gradient-to-br from-[#FFF5F3] to-white p-6 md:p-7 mb-8 flex flex-col md:flex-row md:items-center gap-5">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-[#E5484D] text-white flex items-center justify-center">
          <BugReportOutlinedIcon sx={{ fontSize: 26 }} />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#B5322D]">
            Something wrong?
          </p>
          <h3 className="text-[19px] md:text-[21px] font-semibold text-[#1E1442] mt-0.5">
            Report a bug or send feedback
          </h3>
          <p className="text-sm text-[#4A3F6B] mt-1.5 leading-relaxed max-w-2xl">
            Run into a glitch, confusing flow, or something broken? Send the
            details straight to the CourseConnect team — we&apos;ll jump on it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBugOpen(true)}
          className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#E5484D] text-white hover:bg-[#C43A3E] font-semibold px-5 py-2.5 rounded-full shadow-[0_6px_20px_rgba(229,72,77,0.25)] transition-colors"
        >
          <BugReportOutlinedIcon sx={{ fontSize: 20 }} />
          Report a bug
        </button>
      </div>

      {/* Role tabs */}
      {visibleRoles.length > 1 && (
        <Box
          sx={{
            display: 'inline-flex',
            p: 0.5,
            mb: 4,
            backgroundColor: '#F4F1FC',
            borderRadius: '999px',
          }}
        >
          <Tabs
            value={activeIndex}
            onChange={(_, v) => setActiveKey(visibleRoles[v])}
            TabIndicatorProps={{ sx: { display: 'none' } }}
            sx={{
              minHeight: 'auto',
              '& .MuiTabs-flexContainer': { gap: 0.5 },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.88rem',
                minHeight: 36,
                py: 0.75,
                px: 2.5,
                borderRadius: '999px',
                color: '#6B5AA8',
                transition: 'all 0.15s ease',
              },
              '& .Mui-selected': {
                color: '#fff !important',
                backgroundColor: '#5A41D8',
                boxShadow: '0 4px 12px rgba(90, 65, 216, 0.24)',
              },
            }}
          >
            {visibleRoles.map((key) => (
              <Tab
                key={key}
                label={
                  key === defaultKey
                    ? `${HELP_GUIDES[key].label} (you)`
                    : HELP_GUIDES[key].label
                }
              />
            ))}
          </Tabs>
        </Box>
      )}

      {/* Overview */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block w-1 h-5 rounded-full bg-[#5A41D8]" />
          <h3 className="text-lg font-semibold text-[#1E1442]">
            {guide.label} overview
          </h3>
        </div>
        <p className="text-[#6B5AA8] text-sm md:text-[15px] max-w-3xl">
          {guide.tagline}
        </p>
        <p className="mt-3 text-[#4A3F6B] text-sm md:text-[15px] leading-relaxed max-w-3xl">
          {guide.overview}
        </p>
      </section>

      {/* Quick start */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <RocketLaunchOutlinedIcon sx={{ color: '#5A41D8', fontSize: 20 }} />
          <h3 className="text-lg font-semibold text-[#1E1442]">Quick start</h3>
        </div>
        <ol className="grid md:grid-cols-2 gap-3">
          {guide.quickStart.map((step, i) => (
            <li
              key={i}
              className="rounded-xl border border-[#E7E1F7] bg-white p-4 flex items-start gap-3"
            >
              <span className="shrink-0 w-7 h-7 rounded-full bg-[#F4F1FC] text-[#5A41D8] text-sm font-semibold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-sm text-[#2E2551] leading-relaxed">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Feature sections */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-block w-1 h-5 rounded-full bg-[#5A41D8]" />
          <h3 className="text-lg font-semibold text-[#1E1442]">
            How to use each feature
          </h3>
        </div>
        <div className="grid gap-3">
          {guide.sections.map((section) => (
            <FeatureCard
              key={section.id}
              section={section}
              isOpen={openSection === section.id}
              onToggle={() =>
                setOpenSection((curr) =>
                  curr === section.id ? null : section.id
                )
              }
              isOwnRole={activeKey === defaultKey}
            />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-block w-1 h-5 rounded-full bg-[#5A41D8]" />
          <h3 className="text-lg font-semibold text-[#1E1442]">
            Frequently asked questions
          </h3>
        </div>
        <div className="grid gap-3">
          {guide.faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#E7E1F7] bg-white p-5"
            >
              <p className="text-sm font-semibold text-[#1E1442]">{faq.q}</p>
              <p className="text-sm text-[#4A3F6B] mt-1.5 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <BugReportDialog
        open={bugOpen}
        onClose={() => setBugOpen(false)}
        role={role}
      />
    </div>
  );
};

type FeatureCardProps = {
  section: HelpSection;
  isOpen: boolean;
  onToggle: () => void;
  isOwnRole: boolean;
};

const FeatureCard: React.FC<FeatureCardProps> = ({
  section,
  isOpen,
  onToggle,
  isOwnRole,
}) => {
  const Icon = section.icon;
  return (
    <div className="rounded-xl border border-[#E7E1F7] bg-white overflow-hidden transition-shadow duration-200 hover:shadow-[0_8px_24px_-12px_rgba(90,65,216,0.25)]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-4 p-5 text-left"
        aria-expanded={isOpen}
      >
        <div className="shrink-0 w-10 h-10 rounded-lg bg-[#F4F1FC] text-[#5A41D8] flex items-center justify-center">
          <Icon fontSize="small" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-[15px] font-semibold text-[#1E1442]">
              {section.title}
            </h4>
          </div>
          <p className="text-sm text-[#6B5AA8] mt-1 leading-relaxed">
            {section.summary}
          </p>
        </div>
        <span
          aria-hidden
          className={`shrink-0 text-[#6B5AA8] mt-2 transition-transform duration-200 ${
            isOpen ? 'rotate-90' : ''
          }`}
        >
          <ArrowForwardRoundedIcon fontSize="small" />
        </span>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-0 border-t border-[#F0EBFB]">
          <ol className="mt-4 space-y-2.5">
            {section.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircleOutlineRoundedIcon
                  sx={{ color: '#5A41D8', fontSize: 18, mt: '2px' }}
                />
                <span className="text-sm text-[#2E2551] leading-relaxed">
                  {step}
                </span>
              </li>
            ))}
          </ol>

          {section.tips && section.tips.length > 0 && (
            <div className="mt-4 rounded-lg bg-[#FBF9FF] border border-[#EFE8FB] p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <LightbulbOutlinedIcon
                  sx={{ color: '#5A41D8', fontSize: 18 }}
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#5A41D8]">
                  Tips
                </span>
              </div>
              <ul className="space-y-1.5">
                {section.tips.map((tip, i) => (
                  <li
                    key={i}
                    className="text-sm text-[#4A3F6B] leading-relaxed"
                  >
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {section.path && isOwnRole && (
            <div className="mt-4">
              <Link
                href={section.path}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5A41D8] hover:text-[#2d0f83] transition-colors"
              >
                Open {section.title}
                <ArrowForwardRoundedIcon fontSize="small" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

type BugReportDialogProps = {
  open: boolean;
  onClose: () => void;
  role: Role | string | undefined;
};

const BugReportDialog: React.FC<BugReportDialogProps> = ({
  open,
  onClose,
  role,
}) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setSummary('');
    setDescription('');
    setSeverity('medium');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
    setTimeout(reset, 200);
  };

  const handleSubmit = async () => {
    if (!summary.trim() || !description.trim()) {
      setError('Please add a short summary and a description.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: summary.trim(),
          description: description.trim(),
          severity,
          pageUrl:
            typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent:
            typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          user: {
            uid: user?.uid,
            email: user?.email ?? undefined,
            displayName: user?.displayName ?? undefined,
            role: typeof role === 'string' ? role : undefined,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not send the bug report.');
      }
      setSuccess(true);
      setTimeout(() => {
        onClose();
        reset();
      }, 1200);
    } catch (e: any) {
      setError(e.message || 'Could not send the bug report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 600, color: '#1E1442' }}>
        Report a bug
      </DialogTitle>
      <DialogContent dividers>
        {success ? (
          <Alert severity="success">
            Thanks! Your report was sent to the CourseConnect team.
          </Alert>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              label="Short summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              fullWidth
              required
              inputProps={{ maxLength: 140 }}
              helperText={`${summary.length}/140`}
              sx={{ mb: 2 }}
              disabled={submitting}
            />
            <TextField
              label="What happened? Include steps to reproduce if you can."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              required
              multiline
              minRows={5}
              inputProps={{ maxLength: 4000 }}
              sx={{ mb: 2 }}
              disabled={submitting}
            />
            <TextField
              label="Severity"
              value={severity}
              onChange={(e) =>
                setSeverity(e.target.value as 'low' | 'medium' | 'high')
              }
              select
              fullWidth
              disabled={submitting}
            >
              <MenuItem value="low">Low — minor annoyance</MenuItem>
              <MenuItem value="medium">Medium — noticeable issue</MenuItem>
              <MenuItem value="high">High — blocker / broken</MenuItem>
            </TextField>
            <p className="text-xs text-[#6B5AA8] mt-3">
              We&apos;ll include your email, role, and the page URL so the team
              can follow up.
            </p>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          {success ? 'Close' : 'Cancel'}
        </Button>
        {!success && (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            variant="contained"
            sx={{
              backgroundColor: '#5A41D8',
              '&:hover': { backgroundColor: '#2d0f83' },
            }}
            startIcon={
              submitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <BugReportOutlinedIcon />
              )
            }
          >
            {submitting ? 'Sending…' : 'Send report'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default HelpView;
