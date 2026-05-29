import { useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// canvas в реальном размере, не вылезает за контейнер из-за max-width/height и object-fit
export default function ImageCanvas({ image }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!image) return
    const canvas = canvasRef.current
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')
    ctx.putImageData(image.imageData, 0, 0)
  }, [image])

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
