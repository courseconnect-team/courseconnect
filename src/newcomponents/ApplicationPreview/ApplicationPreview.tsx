import React from 'react';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import { ApplicationData } from '@/types/query';

type Status = 'Review' | 'Approved' | 'Denied' | 'Assigned';

type Props = {
  data: ApplicationData | undefined;
  status?: Status;
  onThumbUp?: () => void;
  onThumbDown?: () => void;
};

export function ApplicationPreview({
  data,
  status = 'Review',
  onThumbUp,
  onThumbDown,
}: Props) {
  const {
    firstname,
    lastname,
    email,
    phonenumber,
    position,
    available_hours,
    department,
    degree,
    gpa,
    qualifications,
    resume_link,
  } = data!;

  const initials =
    `${firstname?.[0] ?? ''}${lastname?.[0] ?? ''}`.toUpperCase() || '?';

  const availabilityText = Array.isArray(available_hours)
    ? available_hours.join(', ')
    : available_hours;

  return (
    <div
      className={[
        // card
        'rounded-[20px] shadow-[0_2px_20px_4px_rgba(0,0,0,0.25)] bg-white',
        // old container had side margins; the modal provides outer padding already,
        // so keep inner padding generous
        'px-6 md:px-10 py-4',
        "font-['SF_Pro_Display',Helvetica,Arial,sans-serif]",
        'text-black',
      ].join(' ')}
    >
      {/* header row: avatar + identity + actions */}
      <div className="flex items-center justify-between">
        {/* Left: avatar + identity */}
        <div className="flex items-start gap-4 md:gap-6">
          {/* avatar (old .ellipse) */}
          <div
            className={[
              'h-[71px] w-[71px] rounded-full',
              'bg-[rgba(158,158,158,0.58)] border-2 border-[#4d4d4d]',
              'flex items-center justify-center text-white text-xl font-semibold select-none',
            ].join(' ')}
          >
            {initials}
          </div>

          <div className="relative">
            {/* name (old .name) */}
            <div className="text-[24px] leading-7 font-normal whitespace-nowrap">
              {firstname} {lastname}
            </div>
            {/* email + phone (old were absolutely positioned; stacked here) */}
            <div className="mt-1 space-y-0.5">
              <div className="text-[16px] text-[#9e9e9e]">{email}</div>
              <div className="text-[16px] text-[#9e9e9e]">{phonenumber}</div>
            </div>
          </div>
        </div>

        {/* Right: actions + status badge (old .thumbsContainer + .applicantStatus23/.review23) */}

        {status === 'Review' && (
          <div className="flex items-center gap-4">
            <button
              onClick={onThumbUp}
              className="inline-flex items-center justify-center
                 min-w-[100px] h-8 px-5
                 rounded-lg text-sm font-semibold border transition
                 bg-status-approvedLt text-status-approved border-status-approved
                 hover:bg-status-approved hover:cursor-pointer hover:text-on-primary"
            >
              Approve
            </button>

            <button
              onClick={onThumbDown}
              className="inline-flex items-center justify-center
                 min-w-[100px] h-8 px-5
                 rounded-lg text-sm font-semibold border transition
                 bg-status-errorLt text-status-error border-status-error
                 hover:bg-status-error hover:cursor-pointer  hover:text-on-primary"
            >
              Deny
            </button>
          </div>
        )}
      </div>

      {/* DETAILS (converted from your old right column) */}
      <div
        className={[
          // old had ml: 143px, mr: 139px; keep roomy margins on desktop
          'mt-6 flex flex-col',
          'ml-6 mr-6 md:ml-[143px] md:mr-[139px]',
        ].join(' ')}
      >
        {/* Applying for */}
        <div className="flex gap-[61px] items-start">
          <div className="text-[16px] font-medium mb-[10px]">Applying for:</div>
          <div className="text-[20px] font-normal text-[#4c4c4c]">
            {position ?? '—'}
          </div>
        </div>

        {/* Availability */}
        <div className="flex gap-[75px] items-start mt-1">
          <div className="text-[16px] font-medium mb-[10px]">
            Availablility:
          </div>
          <div className="text-[20px] font-normal text-[#4c4c4c]">
            {availabilityText} hours/week
          </div>
        </div>

        {/* Spacer like old <br> */}
        <div className="h-4" />

        {/* Department / Degree / GPA in a row with big gap and bottom margin */}
        <div
          className={['flex flex-row flex-wrap gap-[144px] mb-[31px]'].join(
            ' '
          )}
        >
          <div className="text-center">
            <div className="text-[16px] font-medium mb-[10px]">Department:</div>
            <div className="text-[20px] font-normal text-[#4c4c4c]">
              {department ?? '—'}
            </div>
          </div>

          <div className="text-center">
            <div className="text-[16px] font-medium mb-[10px]">Degree:</div>
            <div className="text-[20px] font-normal text-[#4c4c4c]">
              {degree ?? '—'}
            </div>
          </div>

          <div className="text-center">
            <div className="text-[16px] font-medium mb-[10px]">GPA:</div>
            <div className="text-[20px] font-normal text-[#4c4c4c]">
              {gpa ?? '—'}
            </div>
          </div>
        </div>

        {/* Qualifications */}
        <div className="text-[16px] font-medium mb-[10px]">Qualifications:</div>
        <div className="text-[20px] font-normal text-[#4c4c4c] mb-[31px] whitespace-pre-wrap">
          {qualifications ?? '—'}
        </div>

        {/* Resume */}
        <div className="text-[16px] font-medium mb-[10px]">Resume Link:</div>
        {resume_link ? (
          <a
            className="text-[20px] font-normal text-[#4c4c4c] underline mb-[104px]"
            href={resume_link}
            target="_blank"
            rel="noopener noreferrer"
          >
            {resume_link}
          </a>
        ) : (
          <span className="text-[20px] font-normal text-[#4c4c4c] mb-[104px]">
            Missing
          </span>
        )}
      </div>
    </div>
  );
}
