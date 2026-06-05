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

    // есть ли у картинки реальная альфа
    const hasAlpha = !!image && (image.depth === 32 || image.depth === 8)

    // позиция среднего маркера по текущей гамме
    const midPos = cur.bp + Math.pow(0.5, cur.gamma) * (cur.wp - cur.bp)
    const markers = [cur.bp, midPos, cur.wp]

    // двигаем маркеры 0 чёрный 1 гамма 2 белый
    function handleMarkers(value, activeThumb) {
        const [bp, mid, wp] = value
        if (wp - bp < 2) return

        let gamma = cur.gamma
        if (activeThumb === 1) {
            let m = (mid - bp) / (wp - bp)
            if (m < 0.001) m = 0.001
            if (m > 0.999) m = 0.999
            gamma = Math.log(m) / Math.log(0.5)
            if (gamma < 0.1) gamma = 0.1
            if (gamma > 9.9) gamma = 9.9
        }
        setLevels({ ...levels, [channel]: { bp, wp, gamma } })
    }

    return (
        <>
            {/* убираем затемнение фона чтобы холст было видно */}
            <style>{`.levels-dialog::backdrop { background: transparent; }`}</style>
            <dialog
                ref={dialogRef}
                className="levels-dialog"
                onCancel={handleCancel}
                style={{
                    background: '#21252b',
                    color: '#fff',
                    border: '1px solid #3a3f4b',
                    borderRadius: 8,
                    padding: 16,
                    width: 360,
                    margin: 0,
                    position: 'fixed',
                    top: 80,
                    right: 24,
                }}
            >
                <Typography variant="h6" sx={{ mb: 1 }}>Уровни</Typography>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                    <Select
                        size="small"
                        value={channel}
                        onChange={(e) => setChannel(e.target.value)}
                        MenuProps={{ container: () => dialogRef.current }}
                    >
                        <MenuItem value="rgb">RGB</MenuItem>
                        <MenuItem value="r">Red</MenuItem>
                        <MenuItem value="g">Green</MenuItem>
                        <MenuItem value="b">Blue</MenuItem>
                        {hasAlpha && <MenuItem value="a">Alpha</MenuItem>}
                    </Select>
                    <FormControlLabel
                        control={<Checkbox checked={logScale} onChange={(e) => setLogScale(e.target.checked)} />}
                        label="лог"
                    />
                </Box>

                <canvas ref={histRef} width={320} height={160} style={{ width: '100%', display: 'block', background: '#282c34' }} />

                {/* три маркера прямо под осью гистограммы */}
                <Box sx={{ px: 1, mt: 0.5 }}>
                    <Slider
                        value={markers}
                        onChange={(e, v, thumb) => handleMarkers(v, thumb)}
                        min={0}
                        max={255}
                        step={1}
                        disableSwap
                        size="small"
                        sx={{ width: '100%' }}
                    />
                </Box>

                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                    Чёрная {cur.bp} · Гамма {cur.gamma.toFixed(2)} · Белая {cur.wp}
                </Typography>

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
        </>
    )
}