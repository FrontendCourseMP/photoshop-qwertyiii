import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Slider from '@mui/material/Slider'

// размер в кб по формуле n*m*a*k бит
function sizeInKB(image) {
  const bitsPerChannel = image.depth / image.channels
  const totalBits = image.width * image.height * image.channels * bitsPerChannel
  const kb = totalBits / 8 / 1024
  return kb.toFixed(2)
}

export default function StatusBar({ image, pickedPixel, scale, onScaleChange }) {
  return (
    <Box
      component="footer"
      sx={{
        px: 2,
        py: 0.5,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        gap: 3,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      {image ? (
        <>
          <Typography variant="body2">Формат: {image.format.toUpperCase()}</Typography>
          <Typography variant="body2">
            Размер: {image.width} × {image.height} px
          </Typography>
          <Typography variant="body2">Глубина цвета: {image.depth} bpp</Typography>
          <Typography variant="body2">Объём: {sizeInKB(image)} КБ</Typography>
          {pickedPixel && (
            <Typography variant="body2">
              Пипетка:{' '}
              {pickedPixel.a === 0
                ? '—'
                : `X:${pickedPixel.x}, Y:${pickedPixel.y} | RGB(${pickedPixel.r}, ${pickedPixel.g}, ${pickedPixel.b}) | Lab(${pickedPixel.l.toFixed(2)}, ${pickedPixel.labA.toFixed(2)}, ${pickedPixel.labB.toFixed(2)})`}
            </Typography>
          )}

          {/* масштаб показа */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto', minWidth: 220 }}>
            <Typography variant="body2">Масштаб:</Typography>
            <Slider
              size="small"
              min={12}
              max={300}
              value={scale}
              onChange={(e, v) => onScaleChange(v)}
              sx={{ width: 120 }}
            />
            <Typography variant="body2" sx={{ width: 44 }}>{scale}%</Typography>
          </Box>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Нет изображения
        </Typography>
      )}
    </Box>
  )
}