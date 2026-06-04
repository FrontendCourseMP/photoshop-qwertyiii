import { useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { rgbToCielab } from '../imaging/cielab.js'
import { applyChannels } from '../imaging/channels.js'

export default function ImageCanvas({ image, visibility, activeTool, onPick }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!image) return
    const canvas = canvasRef.current
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')
    // рисуем с учётом включённых каналов, оригинал не трогаем
    const shown = applyChannels(image, visibility)
    ctx.putImageData(shown, 0, 0)
  }, [image, visibility])

function handleClick(e) {
    if (activeTool !== 'eyedropper' || !image) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width))
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height))
    if (x < 0 || y < 0 || x >= image.width || y >= image.height) return
    const data = image.imageData.data
    const i = (y * image.width + x) * 4
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    const lab = rgbToCielab(r, g, b)

    onPick({ x, y, r, g, b, a, l: lab.l, labA: lab.a, labB: lab.b })
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        p: 2,
        bgcolor: 'background.default',
      }}
    >
      {image ? (
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
          }}
        />
      ) : (
        <Typography color="text.secondary">
          Откройте изображение (PNG, JPG или GB7)
        </Typography>
      )}
    </Box>
  )
}