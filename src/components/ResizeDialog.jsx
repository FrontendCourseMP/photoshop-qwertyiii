import { useState, useRef, useEffect } from 'react'
import {
  Select, MenuItem, FormControl, InputLabel, FormControlLabel, Checkbox,
  Button, Box, Typography, TextField, Tooltip, IconButton,
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { resizeImage, METHODS } from '../imaging/transforms/resize'

// строку в число
function num(s) {
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

export default function ResizeDialog({ open, image, onClose, onApply }) {
  const dialogRef = useRef(null)

  const [units, setUnits] = useState('percent')
  const [w, setW] = useState('100')
  const [h, setH] = useState('100')
  const [link, setLink] = useState(true)
  const [method, setMethod] = useState('bilinear')

  // открыть закрыть и сброс при открытии
  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    if (open && !dlg.open) {
      setUnits('percent')
      setW('100')
      setH('100')
      setLink(true)
      setMethod('bilinear')
      dlg.showModal()
    }
    if (!open && dlg.open) dlg.close()
  }, [open])

  // без картинки рисовать нечего но хуки уже вызваны выше
  if (!image) return <dialog ref={dialogRef} />

  const W0 = image.width
  const H0 = image.height

  // целевой размер в пикселях
  const newW = units === 'pixels' ? Math.round(num(w)) : Math.round(W0 * num(w) / 100)
  const newH = units === 'pixels' ? Math.round(num(h)) : Math.round(H0 * num(h) / 100)

  const maxVal = units === 'pixels' ? 10000 : 1000
  const okW = num(w) >= 1 && num(w) <= maxVal
  const okH = num(h) >= 1 && num(h) <= maxVal
  const ok = okW && okH && newW >= 1 && newH >= 1

  const mpBefore = (W0 * H0 / 1e6).toFixed(2)
  const mpAfter = (newW * newH / 1e6).toFixed(2)
  const tip = (METHODS.find((m) => m.id === method) || METHODS[0]).tip

  // меняем ширину при связи тянем высоту
  function changeW(val) {
    setW(val)
    if (link) {
      if (units === 'percent') setH(val)
      else setH(String(Math.round(num(val) * H0 / W0)))
    }
  }

  function changeH(val) {
    setH(val)
    if (link) {
      if (units === 'percent') setW(val)
      else setW(String(Math.round(num(val) * W0 / H0)))
    }
  }

  // переключение единиц с пересчётом текущих значений
  function changeUnits(next) {
    if (next === units) return
    const wpx = units === 'pixels' ? num(w) : Math.round(W0 * num(w) / 100)
    const hpx = units === 'pixels' ? num(h) : Math.round(H0 * num(h) / 100)
    if (next === 'pixels') {
      setW(String(wpx))
      setH(String(hpx))
    } else {
      setW(String(Math.round(wpx / W0 * 100)))
      setH(String(Math.round(hpx / H0 * 100)))
    }
    setUnits(next)
  }

  function handleApply() {
    const result = resizeImage(image.imageData, newW, newH, method)
    onApply({ ...image, imageData: result, width: newW, height: newH })
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      style={{ background: '#21252b', color: '#fff', border: '1px solid #3a3f4b', borderRadius: 8, padding: 16, width: 360 }}
    >
      <Typography variant="h6" sx={{ mb: 1 }}>Изменить размер</Typography>

      <Typography variant="body2" sx={{ mb: 1.5 }}>
        Было: {W0} × {H0} px ({mpBefore} Мп)<br />
        Станет: {newW} × {newH} px ({mpAfter} Мп)
      </Typography>

      <FormControl size="small" fullWidth sx={{ mb: 1.5 }}>
        <InputLabel>Единицы</InputLabel>
        <Select
          label="Единицы"
          value={units}
          onChange={(e) => changeUnits(e.target.value)}
          MenuProps={{ container: () => dialogRef.current }}
        >
          <MenuItem value="percent">Проценты</MenuItem>
          <MenuItem value="pixels">Пиксели</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <TextField
          size="small"
          label="Ширина"
          value={w}
          onChange={(e) => changeW(e.target.value)}
          error={!okW}
          fullWidth
        />
        <TextField
          size="small"
          label="Высота"
          value={h}
          onChange={(e) => changeH(e.target.value)}
          error={!okH}
          fullWidth
        />
      </Box>

      <FormControlLabel
        control={<Checkbox checked={link} onChange={(e) => setLink(e.target.checked)} />}
        label="Сохранять пропорции"
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, mb: 1.5 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Алгоритм</InputLabel>
          <Select
            label="Алгоритм"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            MenuProps={{ container: () => dialogRef.current }}
          >
            {METHODS.map((m) => (
              <MenuItem key={m.id} value={m.id}>{m.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title={tip} PopperProps={{ container: () => dialogRef.current }}>
          <IconButton size="small">
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" disabled={!ok} onClick={handleApply}>Применить</Button>
      </Box>
    </dialog>
  )
}