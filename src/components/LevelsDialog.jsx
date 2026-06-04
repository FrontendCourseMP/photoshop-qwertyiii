import { useState, useRef, useEffect } from 'react'
import { Select, MenuItem, FormControlLabel, Checkbox, Button, Box, Typography } from '@mui/material'
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

export default function LevelsDialog({ open, image, onClose, onApply }) {
    const dialogRef = useRef(null)
    const histRef = useRef(null)

    const [channel, setChannel] = useState('rgb') // какой канал крутим
    const [levels, setLevels] = useState(makeLevels()) // все параметры
    const [logScale, setLogScale] = useState(false) // лог шкала гисты
    const [preview, setPreview] = useState(true) // показ вживую

    // открыть закрыть нативный dialog
    useEffect(() => {
        const dlg = dialogRef.current
        if (!dlg) return
        if (open && !dlg.open) {
            setLevels(makeLevels()) // каждый раз чистый лист
            setChannel('rgb')
            setPreview(true)
            dlg.showModal()
        }
        if (!open && dlg.open) dlg.close()
    }, [open])
    // гистограмма когда меняется картинка канал или шкала
    useEffect(() => {
        // картинки нет рисовать нечего
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
    function handleReset() {
        setLevels(makeLevels())
    }
    function handleCancel() {
        onClose()
    }
    function handleApply() {
        const result = applyLevels(image.imageData, levels)
        onApply(result)
        onClose()
    }

    return (
        <dialog
            ref={dialogRef}
            onCancel={handleCancel}
            style={{ background: '#21252b', color: '#fff', border: 'none', borderRadius: 8, padding: 16, width: 360 }}
        >
            <Typography variant="h6" sx={{ mb: 1 }}>Уровни</Typography>

            {/* канал и лог шкала */}
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

            {/* гистограмму нарисуем тут потом */}
            <canvas ref={histRef} width={320} height={160} style={{ width: '100%', background: '#282c34' }} />

            {/* три ползунка bp gamma wp потом */}
            <Box sx={{ my: 1, opacity: 0.5 }}>ползунки будут тут</Box>

            {/* предпросмотр и кнопки */}
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