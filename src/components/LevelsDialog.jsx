import { useState, useRef, useEffect } from 'react'
import { Select, MenuItem, FormControlLabel, Checkbox, Button, Box, Typography, Slider } from '@mui/material'
import { applyLevels, computeHistogram } from '../imaging/levels'

const FLAT = { bp: 0, wp: 255, gamma: 1 }

function makeLevels() {
  return {
    rgb: { ...FLAT },
    r: { ...FLAT },
    g: { ...FLAT },
    b: { ...FLAT },
    a: { ...FLAT },
  }
}

export default function LevelsDialog({ open, image, onClose, onApply, onPreview }) {
  const dialogRef = useRef(null)
  const histRef = useRef(null)

  const [channel, setChannel] = useState('rgb')
  const [levels, setLevels] = useState(makeLevels())
  const [logScale, setLogScale] = useState(false)
  const [preview, setPreview] = useState(true)

  // открыть закрыть нативный dialog
  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    if (open && !dlg.open) {
      setLevels(makeLevels())
      setChannel('rgb')
      setPreview(true)
      dlg.showModal()
    }
    if (!open && dlg.open) dlg.close()
  }, [open])

  // рисуем гистограмму
  useEffect(() => {
    if (!image) return
    const canvas = histRef.current
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    const hist = computeHistogram(image.imageData, channel)

    let max = 0
    for (let i = 0; i < 256; i++) {
      const v = logScale ? Math.log(1 + hist[i]) : hist[i]
      if (v > max) max = v
    }

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#9aa0a6'
    const barW = w / 256
    for (let i = 0; i < 256; i++) {
      const v = logScale ? Math.log(1 + hist[i]) : hist[i]
      const barH = max ? (v / max) * h : 0
      ctx.fillRect(i * barW, h - barH, barW, barH)
    }
  }, [image, channel, logScale])

  // живой предпросмотр на главном холсте
  useEffect(() => {
    if (!image || !open) return
    if (!preview) {
      onPreview(null)
      return
    }
    // rAF чтобы не считать на каждое микродвижение
    const id = requestAnimationFrame(() => {
      onPreview(applyLevels(image.imageData, levels))
    })
    return () => cancelAnimationFrame(id)
  }, [image, levels, preview, open])

  function handleReset() {
    setLevels(makeLevels())
  }

  function handleCancel() {
    onClose()
  }

  function handleApply() {
    onApply(applyLevels(image.imageData, levels))
    onClose()
  }

  const cur = levels[channel]

  function setParam(key, value) {
    setLevels({ ...levels, [channel]: { ...cur, [key]: value } })
  }

  // чёрная не лезет на белую
  function setBp(value) {
    if (value >= cur.wp) value = cur.wp - 1
    setParam('bp', value)
  }

  // белая не лезет на чёрную
  function setWp(value) {
    if (value <= cur.bp) value = cur.bp + 1
    setParam('wp', value)
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      style={{ background: '#21252b', color: '#fff', border: 'none', borderRadius: 8, padding: 16, width: 360 }}
    >
      <Typography variant="h6" sx={{ mb: 1 }}>Уровни</Typography>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
        <Select size="small" value={channel} onChange={(e) => setChannel(e.target.value)}>
          <MenuItem value="rgb">RGB</MenuItem>
          <MenuItem value="r">Red</MenuItem>
          <MenuItem value="g">Green</MenuItem>
          <MenuItem value="b">Blue</MenuItem>
          <MenuItem value="a">Alpha</MenuItem>
        </Select>
        <FormControlLabel
          control={<Checkbox checked={logScale} onChange={(e) => setLogScale(e.target.checked)} />}
          label="лог"
        />
      </Box>

      <canvas ref={histRef} width={320} height={160} style={{ width: '100%', background: '#282c34' }} />

      <Box sx={{ my: 1 }}>
        <Typography variant="caption">Чёрная точка: {cur.bp}</Typography>
        <Slider size="small" min={0} max={255} value={cur.bp} onChange={(e, v) => setBp(v)} />

        <Typography variant="caption">Гамма: {cur.gamma.toFixed(2)}</Typography>
        <Slider size="small" min={0.1} max={9.9} step={0.1} value={cur.gamma} onChange={(e, v) => setParam('gamma', v)} />

        <Typography variant="caption">Белая точка: {cur.wp}</Typography>
        <Slider size="small" min={0} max={255} value={cur.wp} onChange={(e, v) => setWp(v)} />
      </Box>

      <FormControlLabel
        control={<Checkbox checked={preview} onChange={(e) => setPreview(e.target.checked)} />}
        label="Предпросмотр"
      />
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button onClick={handleReset}>Сброс</Button>
        <Button onClick={handleCancel}>Отмена</Button>
        <Button variant="contained" onClick={handleApply}>Применить</Button>
      </Box>
    </dialog>
  )
}