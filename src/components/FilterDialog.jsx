import { useState, useRef, useEffect } from 'react'
import {
  Select, MenuItem, FormControl, InputLabel, FormControlLabel, Checkbox,
  Button, Box, Typography, TextField,
} from '@mui/material'
import { PRESETS, applyConvolution } from '../imaging/filters/convolution'

// строку в число
function num(s) {
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

const IDENTITY = PRESETS[0].kernel.map(String)

export default function FilterDialog({ open, image, onClose, onApply, onPreview }) {
  const dialogRef = useRef(null)
  // номер запуска для отмены устаревшего предпросмотра
  const runRef = useRef(0)

  const [presetId, setPresetId] = useState('identity')
  const [cells, setCells] = useState(IDENTITY)
  const [channels, setChannels] = useState({ r: true, g: true, b: true, a: false })
  const [edge, setEdge] = useState('copy')
  const [preview, setPreview] = useState(true)
  const [busy, setBusy] = useState(false)

  // открытие закрытие и сброс при открытии
  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    if (open && !dlg.open) {
      setPresetId('identity')
      setCells(IDENTITY)
      setChannels({ r: true, g: true, b: true, a: false })
      setEdge('copy')
      setPreview(true)
      setBusy(false)
      dlg.showModal()
    }
    if (!open && dlg.open) dlg.close()
  }, [open])

  // живой предпросмотр на холсте
  useEffect(() => {
    if (!image || !open) return
    if (!preview) {
      onPreview(null)
      return
    }
    const token = ++runRef.current
    // задержка чтобы не считать на каждый символ
    const timer = setTimeout(async () => {
      const kernel = cells.map(num)
      const result = await applyConvolution(
        image.imageData, kernel, channels, edge,
        () => token !== runRef.current,
      )
      if (result && token === runRef.current) onPreview(result)
    }, 150)
    return () => clearTimeout(timer)
  }, [image, open, preview, cells, channels, edge])

  if (!image) return <dialog ref={dialogRef} className="filter-dialog" />

  const hasAlpha = image.depth === 32 || image.depth === 8
  // gb7 это серое изображение значит вместо rgb один серый канал
  const isGray = image.format === 'gb7'

  // выбор преднастройки заполняет поля
  function selectPreset(id) {
    setPresetId(id)
    const p = PRESETS.find((x) => x.id === id)
    if (p) setCells(p.kernel.map(String))
  }

  // правка ячейки делает ядро своим
  function changeCell(i, val) {
    const next = cells.slice()
    next[i] = val
    setCells(next)
    setPresetId('custom')
  }

  function toggleChannel(key) {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // серый переключается сразу по r g b
  function toggleGray() {
    setChannels((prev) => {
      const v = !prev.r
      return { ...prev, r: v, g: v, b: v }
    })
  }

  function handleReset() {
    setPresetId('identity')
    setCells(IDENTITY)
    setChannels({ r: true, g: true, b: true, a: false })
    setEdge('copy')
  }

  async function handleApply() {
    const token = ++runRef.current
    setBusy(true)
    const kernel = cells.map(num)
    const result = await applyConvolution(
      image.imageData, kernel, channels, edge,
      () => token !== runRef.current,
    )
    setBusy(false)
    if (result) {
      onApply(result)
      onClose()
    }
  }

  return (
    <>
      {/* фон не затемняется чтобы холст был виден */}
      <style>{`.filter-dialog::backdrop { background: transparent; }`}</style>
      <dialog
        ref={dialogRef}
        className="filter-dialog"
        onCancel={onClose}
        style={{
          background: '#21252b',
          color: '#fff',
          border: '1px solid #3a3f4b',
          borderRadius: 8,
          padding: 16,
          width: 320,
          margin: 0,
          position: 'fixed',
          top: 80,
          right: 24,
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>Фильтр</Typography>

        <FormControl size="small" fullWidth sx={{ mb: 1 }}>
          <InputLabel>Преднастройка</InputLabel>
          <Select
            label="Преднастройка"
            value={presetId}
            onChange={(e) => selectPreset(e.target.value)}
            MenuProps={{ container: () => dialogRef.current }}
          >
            {PRESETS.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.label}</MenuItem>
            ))}
            <MenuItem value="custom">Своё</MenuItem>
          </Select>
        </FormControl>

        {/* сетка ядра 3 на 3 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5, mb: 1 }}>
          {cells.map((v, i) => (
            <TextField
              key={i}
              size="small"
              value={v}
              onChange={(e) => changeCell(i, e.target.value)}
              inputProps={{ style: { textAlign: 'center', padding: 6 } }}
            />
          ))}
        </Box>

        {/* выбор каналов для gb7 один серый вместо rgb */}
        <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
          {isGray ? (
            <FormControlLabel control={<Checkbox checked={channels.r} onChange={toggleGray} />} label="Серый" />
          ) : (
            <>
              <FormControlLabel control={<Checkbox checked={channels.r} onChange={() => toggleChannel('r')} />} label="R" />
              <FormControlLabel control={<Checkbox checked={channels.g} onChange={() => toggleChannel('g')} />} label="G" />
              <FormControlLabel control={<Checkbox checked={channels.b} onChange={() => toggleChannel('b')} />} label="B" />
            </>
          )}
          {hasAlpha && (
            <FormControlLabel control={<Checkbox checked={channels.a} onChange={() => toggleChannel('a')} />} label="A" />
          )}
        </Box>

        <FormControl size="small" fullWidth sx={{ mb: 1 }}>
          <InputLabel>Края</InputLabel>
          <Select
            label="Края"
            value={edge}
            onChange={(e) => setEdge(e.target.value)}
            MenuProps={{ container: () => dialogRef.current }}
          >
            <MenuItem value="copy">Копировать край</MenuItem>
            <MenuItem value="black">Чёрный</MenuItem>
            <MenuItem value="white">Белый</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={<Checkbox checked={preview} onChange={(e) => setPreview(e.target.checked)} />}
          label="Предпросмотр"
        />

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button onClick={handleReset}>Сброс</Button>
          <Button onClick={onClose}>Отмена</Button>
          <Button variant="contained" disabled={busy} onClick={handleApply}>
            {busy ? 'Обработка…' : 'Применить'}
          </Button>
        </Box>
      </dialog>
    </>
  )
}