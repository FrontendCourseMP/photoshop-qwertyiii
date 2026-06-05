import { useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { rgbToCielab } from '../imaging/cielab.js'
import { applyChannels } from '../imaging/channels.js'
import { resizeImage } from '../imaging/transforms/resize.js'

export default function ImageCanvas({ image, visibility, activeTool, onPick, previewData, scale, onScaleChange, fitToken }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  // при новом файле вписываем картинку в холст с отступами 50px
  useEffect(() => {
    if (!image || !containerRef.current) return
    const cw = containerRef.current.clientWidth - 100
    const ch = containerRef.current.clientHeight - 100
    let s = Math.min(cw / image.width, ch / image.height) * 100
    s = Math.max(12, Math.min(300, Math.floor(s)))
    onScaleChange(s)
  }, [fitToken])

  // рисуем картинку в нужном масштабе своей интерполяцией
  useEffect(() => {
    if (!image) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const base = previewData ? { ...image, imageData: previewData } : image
    const shown = applyChannels(base, visibility)

    const dw = Math.max(1, Math.round(image.width * scale / 100))
    const dh = Math.max(1, Math.round(image.height * scale / 100))
    const out = (dw === image.width && dh === image.height) ? shown : resizeImage(shown, dw, dh, 'bilinear')

    canvas.width = dw
    canvas.height = dh
    ctx.putImageData(out, 0, 0)
  }, [image, visibility, previewData, scale])

  function handleClick(e) {
    if (activeTool !== 'eyedropper' || !image) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const cx = (e.clientX - rect.left) * (canvas.width / rect.width)
    const cy = (e.clientY - rect.top) * (canvas.height / rect.height)
    const x = Math.floor(cx * image.width / canvas.width)
    const y = Math.floor(cy * image.height / canvas.height)
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
      ref={containerRef}
      sx={{
        flexGrow: 1,
        minHeight: 0,
        display: 'flex',
        overflow: 'auto',
        p: 2,
        bgcolor: 'background.default',
      }}
    >
      {image ? (
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          style={{
            flexShrink: 0,
            margin: 'auto',
            imageRendering: 'pixelated',
          }}
        />
      ) : (
        <Typography sx={{ m: 'auto' }} color="text.secondary">
          Откройте изображение (PNG, JPG или GB7)
        </Typography>
      )}
    </Box>
  )
}