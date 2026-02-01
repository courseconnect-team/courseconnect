// AnnouncementListItem.tsx
import * as React from 'react';
import { Box, Stack, Avatar, Typography, Divider } from '@mui/material';

export type AnnouncementListItemProps = {
  title: string;
  preview: string; // plain-text, already truncated to ~140 if you want
  postedAt: Date | string | number; // Date or timestamp
  onClick?: () => void;
  unread?: boolean; // optional: bold if unread
};

function formatDate(d: Date | string | number) {
  const date = d instanceof Date ? d : new Date(d);
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export default function AnnouncementListItem({
  title,
  preview,
  postedAt,
  onClick,
  unread = false,
}: AnnouncementListItemProps) {
  const initial = (title?.[0] ?? 'A').toUpperCase();

  return (
    <Box>
      {/* top hairline like in the screenshot */}
      <Divider />
      <Box
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
        sx={{
          px: 1.5,
          py: 1,
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': onClick ? { backgroundColor: 'action.hover' } : undefined,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: 'grey.800',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {initial}
          </Avatar>

          {/* Left: subject + preview (ellipsized) */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: unread ? 700 : 600, lineHeight: 1.2 }}
              noWrap
              title={title}
            >
              {title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              title={preview}
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {preview}
            </Typography>
          </Box>

          {/* Right: Posted on */}
          <Box sx={{ pl: 1, minWidth: 140, textAlign: 'right' }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', lineHeight: 1 }}
            >
              Posted on:
            </Typography>
            <Typography variant="caption" sx={{ lineHeight: 1 }}>
              {formatDate(postedAt)}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
