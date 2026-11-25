import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { formatMonitorDate } from '../formatMonitorDate';
import { EVENT_LABEL } from './issueStatus';
import type { IssueEvent } from '../../../services/monitor.service';

export interface IssueTimelineProps {
  id: string;
  events: readonly IssueEvent[];
}

/** One issue's history, oldest first, as an ordered list. */
export function IssueTimeline({ id, events }: IssueTimelineProps) {
  if (!events.length) {
    return (
      <Typography id={id} variant="body2" color="text.secondary">
        No history yet.
      </Typography>
    );
  }

  return (
    <Box
      component="ol"
      id={id}
      sx={{
        listStyle: 'none',
        m: 0,
        p: 0,
        display: 'grid',
        gap: 1.25,
        '& li': { position: 'relative', pl: 2.5 },
        '& li::before': {
          content: '""',
          position: 'absolute',
          left: 4,
          top: '0.5em',
          width: 7,
          height: 7,
          borderRadius: '50%',
          bgcolor: 'text.secondary',
        },
      }}
    >
      {events.map((event) => (
        <li key={event.id}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {EVENT_LABEL[event.kind]}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontVariantNumeric: 'tabular-nums' }}>
            <time dateTime={event.created_at}>{formatMonitorDate(event.created_at)}</time>
          </Typography>
          {event.note && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, overflowWrap: 'anywhere' }}>
              Note: {event.note}
            </Typography>
          )}
        </li>
      ))}
    </Box>
  );
}

export default IssueTimeline;
