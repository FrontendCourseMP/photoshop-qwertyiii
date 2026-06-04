import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ColorizeIcon from '@mui/icons-material/Colorize'
import TuneIcon from '@mui/icons-material/Tune'

// левая панель инструментов
export default function ToolsPanel({ activeTool, setActiveTool, hasImage, onOpenLevels }) {
  return (
    <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Инструменты
      </Typography>
      <Button
        fullWidth
        size="small"
        startIcon={<ColorizeIcon />}
        variant={activeTool === 'eyedropper' ? 'contained' : 'outlined'}
        disabled={!hasImage}
        onClick={() => setActiveTool(activeTool === 'eyedropper' ? 'none' : 'eyedropper')}
      >
        Пипетка
      </Button>
      <Button
        fullWidth
        size="small"
        startIcon={<TuneIcon />}
        variant="outlined"
        disabled={!hasImage}
        onClick={onOpenLevels}
        sx={{ mt: 1 }}
      >
        Уровни
      </Button>
    </Box>
  )
}