import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import type { Statement, StatementBlock } from './buildStatement';

export interface StatementPreviewProps {
  statement: Statement;
}

function Block({ block }: { block: StatementBlock }) {
  if (block.kind === 'paragraph') {
    return <Typography variant="body2" sx={{ mb: 1.5 }}>{block.text}</Typography>;
  }
  const items =
    block.kind === 'list'
      ? block.items.map((item) => <li key={item}>{item}</li>)
      : [
          <li key="email">
            Email: {block.email ? <Link href={`mailto:${block.email}`}>{block.email}</Link> : <em>your contact email</em>}
          </li>,
          ...(block.phone ? [<li key="phone">Phone: {block.phone}</li>] : []),
        ];
  return (
    <Box component="ul" sx={{ typography: 'body2', mt: 0, mb: 1.5, pl: 3, '& li + li': { mt: 0.5 } }}>
      {items}
    </Box>
  );
}

/**
 * The statement as it will read on the owner's site. Headings start at h2
 * because the page already has its h1.
 */
export function StatementPreview({ statement }: StatementPreviewProps) {
  return (
    <Box component="article" aria-labelledby="statement-preview-title" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
      <Typography id="statement-preview-title" variant="h6" component="h2" sx={{ mb: 2 }}>
        {statement.title}
      </Typography>
      {statement.sections.map((section) => (
        <Box component="section" key={section.heading} sx={{ '& + &': { mt: 2.5 } }}>
          <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
            {section.heading}
          </Typography>
          {section.blocks.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </Box>
      ))}
    </Box>
  );
}
