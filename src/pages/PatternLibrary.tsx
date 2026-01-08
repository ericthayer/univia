import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  IconButton,
  TextField,
  Chip,
  Avatar,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Alert,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  Grid,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Switch,
} from '@mui/material';
import { useState } from 'react';
import Icon from '../components/ui/Icon';
import GlassCard from '../components/ui/GlassCard';
import StatCard from '../components/ui/StatCard';
import ComplianceGauge from '../components/ui/ComplianceGauge';
import packageJson from '../../package.json';

export default function PatternLibrary() {
  const theme = useTheme();
  const [toggleValue, setToggleValue] = useState('left');
  const [selectValue, setSelectValue] = useState('option1');
  const [checkboxValue, setCheckboxValue] = useState(true);
  const [radioValue, setRadioValue] = useState('option1');
  const [switchValue, setSwitchValue] = useState(true);

  const designTokens = {
    colors: {
      primary: theme.palette.primary,
      secondary: theme.palette.secondary,
      error: theme.palette.error,
      warning: theme.palette.warning,
      info: theme.palette.info,
      success: theme.palette.success,
    },
    typography: {
      h1: theme.typography.h1,
      h2: theme.typography.h2,
      h3: theme.typography.h3,
      h4: theme.typography.h4,
      h5: theme.typography.h5,
      h6: theme.typography.h6,
      body1: theme.typography.body1,
      body2: theme.typography.body2,
      caption: theme.typography.caption,
      button: theme.typography.button,
    },
    spacing: {
      xs: theme.spacing(0.5),
      sm: theme.spacing(1),
      md: theme.spacing(2),
      lg: theme.spacing(3),
      xl: theme.spacing(4),
      xxl: theme.spacing(6),
    },
    shadows: [
      theme.shadows[1],
      theme.shadows[2],
      theme.shadows[4],
      theme.shadows[8],
      theme.shadows[16],
    ],
  };

  return (
    <Box sx={{ bgcolor: 'background.default', py: 8 }}>
      <Container maxWidth="xl">
        <Stack gap={6}>
          <Box data-testid="pattern-library-header">
            <Typography variant="h2" gutterBottom>
              Pattern Library
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Comprehensive design system and component library for visual regression testing and
              public documentation
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip label={`Version ${packageJson.version}`} color="primary" size="small" />
              <Typography variant="caption" color="text.secondary">
                Last Updated: {new Date().toLocaleDateString()}
              </Typography>
            </Stack>
          </Box>

          <Divider />

          <Box data-testid="design-tokens-section">
            <Typography variant="h3" gutterBottom>
              Design Tokens
            </Typography>

            <Stack spacing={4}>
              <Box data-testid="color-palette">
                <Typography variant="h5" gutterBottom>
                  Color Palette
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(designTokens.colors).map(([name, palette]) => (
                    <Grid item xs={12} sm={6} md={4} lg={2} key={name}>
                      <Paper
                        elevation={2}
                        data-testid={`color-${name}`}
                        sx={{ p: 2, textAlign: 'center' }}
                      >
                        <Typography variant="subtitle2" gutterBottom sx={{ textTransform: 'capitalize' }}>
                          {name}
                        </Typography>
                        <Stack spacing={1}>
                          <Box
                            sx={{
                              height: 60,
                              bgcolor: palette.main,
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                            data-color={palette.main}
                          />
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {palette.main}
                          </Typography>
                          {palette.light && (
                            <>
                              <Box
                                sx={{
                                  height: 40,
                                  bgcolor: palette.light,
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                }}
                                data-color={palette.light}
                              />
                              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                Light: {palette.light}
                              </Typography>
                            </>
                          )}
                          {palette.dark && (
                            <>
                              <Box
                                sx={{
                                  height: 40,
                                  bgcolor: palette.dark,
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                }}
                                data-color={palette.dark}
                              />
                              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                Dark: {palette.dark}
                              </Typography>
                            </>
                          )}
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box data-testid="typography-scale">
                <Typography variant="h5" gutterBottom>
                  Typography Scale
                </Typography>
                <Stack spacing={2}>
                  {Object.entries(designTokens.typography).map(([variant, style]) => (
                    <Paper
                      key={variant}
                      elevation={1}
                      data-testid={`typography-${variant}`}
                      sx={{ p: 2 }}
                    >
                      <Typography
                        variant={variant as any}
                        sx={{ mb: 1 }}
                        data-variant={variant}
                      >
                        {variant.toUpperCase()} - The quick brown fox jumps over the lazy dog
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                      >
                        Size: {style.fontSize} | Weight: {style.fontWeight} | Line Height:{' '}
                        {style.lineHeight}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Box>

              <Box data-testid="spacing-scale">
                <Typography variant="h5" gutterBottom>
                  Spacing Scale
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(designTokens.spacing).map(([name, value]) => (
                    <Grid item xs={6} md={4} lg={2} key={name}>
                      <Paper elevation={1} data-testid={`spacing-${name}`} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          {name.toUpperCase()}
                        </Typography>
                        <Box
                          sx={{
                            width: value,
                            height: value,
                            bgcolor: 'primary.main',
                            borderRadius: 1,
                          }}
                          data-spacing={value}
                        />
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', mt: 1 }}>
                          {value}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box data-testid="elevation-shadows">
                <Typography variant="h5" gutterBottom>
                  Elevation & Shadows
                </Typography>
                <Grid container spacing={3}>
                  {designTokens.shadows.map((shadow, index) => (
                    <Grid item xs={6} md={4} lg={2} key={index}>
                      <Box
                        data-testid={`shadow-${index}`}
                        sx={{
                          p: 3,
                          bgcolor: 'background.paper',
                          borderRadius: 2,
                          boxShadow: shadow,
                          textAlign: 'center',
                        }}
                        data-shadow={shadow}
                      >
                        <Typography variant="subtitle2">Elevation {index + 1}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Stack>
          </Box>

          <Divider />

          <Box data-testid="atoms-section">
            <Typography variant="h3" gutterBottom>
              Atoms
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Basic building blocks that cannot be broken down further
            </Typography>

            <Stack spacing={4}>
              <Box data-testid="buttons-atom">
                <Typography variant="h5" gutterBottom>
                  Buttons
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Variants
                      </Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap" gap={2}>
                        <Button variant="contained" data-testid="button-contained">
                          Contained
                        </Button>
                        <Button variant="outlined" data-testid="button-outlined">
                          Outlined
                        </Button>
                        <Button variant="text" data-testid="button-text">
                          Text
                        </Button>
                      </Stack>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Colors
                      </Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap" gap={2}>
                        <Button variant="contained" color="primary" data-testid="button-primary">
                          Primary
                        </Button>
                        <Button variant="contained" color="secondary" data-testid="button-secondary">
                          Secondary
                        </Button>
                        <Button variant="contained" color="error" data-testid="button-error">
                          Error
                        </Button>
                        <Button variant="contained" color="success" data-testid="button-success">
                          Success
                        </Button>
                      </Stack>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Sizes
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={2}>
                        <Button variant="contained" size="small" data-testid="button-small">
                          Small
                        </Button>
                        <Button variant="contained" size="medium" data-testid="button-medium">
                          Medium
                        </Button>
                        <Button variant="contained" size="large" data-testid="button-large">
                          Large
                        </Button>
                      </Stack>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        States
                      </Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap" gap={2}>
                        <Button variant="contained" data-testid="button-default">
                          Default
                        </Button>
                        <Button variant="contained" disabled data-testid="button-disabled">
                          Disabled
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<Icon name="add" />}
                          data-testid="button-icon"
                        >
                          With Icon
                        </Button>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              <Box data-testid="icons-atom">
                <Typography variant="h5" gutterBottom>
                  Icons
                </Typography>
                <Paper elevation={1} sx={{ p: 3 }}>
                  <Grid container spacing={2}>
                    {[
                      'home',
                      'dashboard',
                      'checklist',
                      'description',
                      'verified',
                      'school',
                      'lightbulb',
                      'settings',
                      'account_circle',
                      'search',
                      'notifications',
                      'help',
                    ].map((icon) => (
                      <Grid item xs={4} sm={3} md={2} lg={1} key={icon}>
                        <Box
                          data-testid={`icon-${icon}`}
                          sx={{
                            p: 2,
                            textAlign: 'center',
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <Icon name={icon} style={{ fontSize: 24 }} />
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            {icon}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Box>

              <Box data-testid="form-inputs-atom">
                <Typography variant="h5" gutterBottom>
                  Form Inputs
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Text Fields
                      </Typography>
                      <Stack spacing={2}>
                        <TextField
                          label="Standard"
                          variant="outlined"
                          data-testid="textfield-standard"
                        />
                        <TextField
                          label="Filled"
                          variant="filled"
                          data-testid="textfield-filled"
                        />
                        <TextField
                          label="Error State"
                          variant="outlined"
                          error
                          helperText="This field has an error"
                          data-testid="textfield-error"
                        />
                        <TextField
                          label="Disabled"
                          variant="outlined"
                          disabled
                          data-testid="textfield-disabled"
                        />
                      </Stack>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Selects & Controls
                      </Typography>
                      <Stack spacing={2}>
                        <FormControl fullWidth>
                          <InputLabel>Select Option</InputLabel>
                          <Select
                            value={selectValue}
                            label="Select Option"
                            onChange={(e) => setSelectValue(e.target.value)}
                            data-testid="select-standard"
                          >
                            <MenuItem value="option1">Option 1</MenuItem>
                            <MenuItem value="option2">Option 2</MenuItem>
                            <MenuItem value="option3">Option 3</MenuItem>
                          </Select>
                        </FormControl>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={checkboxValue}
                              onChange={(e) => setCheckboxValue(e.target.checked)}
                              data-testid="checkbox-standard"
                            />
                          }
                          label="Checkbox"
                        />
                        <RadioGroup
                          value={radioValue}
                          onChange={(e) => setRadioValue(e.target.value)}
                        >
                          <FormControlLabel
                            value="option1"
                            control={<Radio data-testid="radio-option1" />}
                            label="Radio Option 1"
                          />
                          <FormControlLabel
                            value="option2"
                            control={<Radio data-testid="radio-option2" />}
                            label="Radio Option 2"
                          />
                        </RadioGroup>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={switchValue}
                              onChange={(e) => setSwitchValue(e.target.checked)}
                              data-testid="switch-standard"
                            />
                          }
                          label="Switch"
                        />
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              <Box data-testid="chips-atom">
                <Typography variant="h5" gutterBottom>
                  Chips
                </Typography>
                <Paper elevation={1} sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} flexWrap="wrap" gap={2}>
                    <Chip label="Default" data-testid="chip-default" />
                    <Chip label="Primary" color="primary" data-testid="chip-primary" />
                    <Chip label="Secondary" color="secondary" data-testid="chip-secondary" />
                    <Chip label="Success" color="success" data-testid="chip-success" />
                    <Chip label="Error" color="error" data-testid="chip-error" />
                    <Chip
                      label="With Avatar"
                      avatar={<Avatar>A</Avatar>}
                      data-testid="chip-avatar"
                    />
                    <Chip
                      label="Deletable"
                      onDelete={() => {}}
                      data-testid="chip-deletable"
                    />
                    <Chip
                      label="Outlined"
                      variant="outlined"
                      data-testid="chip-outlined"
                    />
                  </Stack>
                </Paper>
              </Box>

              <Box data-testid="progress-atom">
                <Typography variant="h5" gutterBottom>
                  Progress Indicators
                </Typography>
                <Paper elevation={1} sx={{ p: 3 }}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Linear Progress
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={60}
                        data-testid="progress-linear-determinate"
                        sx={{ mb: 2 }}
                      />
                      <LinearProgress data-testid="progress-linear-indeterminate" />
                    </Box>
                  </Stack>
                </Paper>
              </Box>
            </Stack>
          </Box>

          <Divider />

          <Box data-testid="molecules-section">
            <Typography variant="h3" gutterBottom>
              Molecules
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Simple combinations of atoms functioning together
            </Typography>

            <Stack spacing={4}>
              <Box data-testid="cards-molecule">
                <Typography variant="h5" gutterBottom>
                  Cards
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6} lg={4}>
                    <Card elevation={2} data-testid="card-basic">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Basic Card
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          This is a basic card with content and actions.
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small">Action 1</Button>
                        <Button size="small">Action 2</Button>
                      </CardActions>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6} lg={4}>
                    <GlassCard data-testid="card-glass">
                      <Typography variant="h6" gutterBottom>
                        Glass Card
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        A card with glassmorphism effect
                      </Typography>
                    </GlassCard>
                  </Grid>

                  <Grid item xs={12} md={6} lg={4}>
                    <StatCard
                      title="Stat Card"
                      value="1,234"
                      icon="trending_up"
                      change={12}
                      data-testid="card-stat"
                    />
                  </Grid>
                </Grid>
              </Box>

              <Box data-testid="alerts-molecule">
                <Typography variant="h5" gutterBottom>
                  Alerts
                </Typography>
                <Stack spacing={2}>
                  <Alert severity="success" data-testid="alert-success">
                    This is a success alert
                  </Alert>
                  <Alert severity="info" data-testid="alert-info">
                    This is an info alert
                  </Alert>
                  <Alert severity="warning" data-testid="alert-warning">
                    This is a warning alert
                  </Alert>
                  <Alert severity="error" data-testid="alert-error">
                    This is an error alert
                  </Alert>
                </Stack>
              </Box>

              <Box data-testid="toggles-molecule">
                <Typography variant="h5" gutterBottom>
                  Toggle Button Groups
                </Typography>
                <Paper elevation={1} sx={{ p: 3 }}>
                  <ToggleButtonGroup
                    value={toggleValue}
                    exclusive
                    onChange={(e, value) => value && setToggleValue(value)}
                    data-testid="toggle-group"
                  >
                    <ToggleButton value="left" data-testid="toggle-left">
                      <Icon name="format_align_left" />
                    </ToggleButton>
                    <ToggleButton value="center" data-testid="toggle-center">
                      <Icon name="format_align_center" />
                    </ToggleButton>
                    <ToggleButton value="right" data-testid="toggle-right">
                      <Icon name="format_align_right" />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Paper>
              </Box>
            </Stack>
          </Box>

          <Divider />

          <Box data-testid="organisms-section">
            <Typography variant="h3" gutterBottom>
              Organisms
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Complex components composed of molecules and atoms
            </Typography>

            <Stack spacing={4}>
              <Box data-testid="compliance-gauge-organism">
                <Typography variant="h5" gutterBottom>
                  Compliance Gauge
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6} lg={4}>
                    <Paper elevation={1} sx={{ p: 3 }}>
                      <ComplianceGauge score={85} label="High Compliance" />
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6} lg={4}>
                    <Paper elevation={1} sx={{ p: 3 }}>
                      <ComplianceGauge score={60} label="Medium Compliance" />
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6} lg={4}>
                    <Paper elevation={1} sx={{ p: 3 }}>
                      <ComplianceGauge score={30} label="Low Compliance" />
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              <Box data-testid="toolbar-organism">
                <Typography variant="h5" gutterBottom>
                  Toolbar Example
                </Typography>
                <Paper elevation={2} sx={{ p: 2 }} data-testid="toolbar-example">
                  <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={2} alignItems="center">
                      <IconButton>
                        <Icon name="menu" />
                      </IconButton>
                      <Typography variant="h6">Toolbar Title</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Search">
                        <IconButton>
                          <Icon name="search" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Notifications">
                        <IconButton>
                          <Icon name="notifications" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Settings">
                        <IconButton>
                          <Icon name="settings" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Paper>
              </Box>
            </Stack>
          </Box>

          <Divider />

          <Box data-testid="usage-guidelines">
            <Typography variant="h3" gutterBottom>
              Usage Guidelines
            </Typography>
            <Paper elevation={1} sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6">Visual Regression Testing</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Each component includes data-testid attributes for easy integration with testing
                  frameworks like Playwright, Cypress, or Percy. Use these selectors to capture
                  screenshots for visual regression tests.
                </Typography>

                <Typography variant="h6">Component Documentation</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  All components follow Material-UI conventions and include proper ARIA labels for
                  accessibility. Refer to the MUI documentation for detailed props and API
                  information.
                </Typography>

                <Typography variant="h6">Atomic Design Taxonomy</Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Atoms:</strong> Basic building blocks (buttons, inputs, icons)
                  <br />
                  <strong>Molecules:</strong> Simple combinations of atoms (cards, alerts, form
                  groups)
                  <br />
                  <strong>Organisms:</strong> Complex components (navigation bars, forms, data
                  tables)
                </Typography>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
