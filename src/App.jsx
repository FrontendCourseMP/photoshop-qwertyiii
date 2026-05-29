import { useState } from 'react'
import Box from '@mui/material/Box'
import TopToolbar from './components/Toolbar.jsx'
import ImageCanvas from './components/ImageCanvas.jsx'
import StatusBar from './components/StatusBar.jsx'
import { loadImageFile, saveImageFile } from './imaging/imageIO.js'

export default function App() {
  // текущая картинка: { imageData, width, height, depth, channels, format, fileName }
  const [image, setImage] = useState(null)
  // активный инструмент и результат пипетки
  const [activeTool, setActiveTool] = useState('none')
  const [pickedPixel, setPickedPixel] = useState(null)

  async function handleOpenFile(file) {
    try {
      const loaded = await loadImageFile(file)
      setImage(loaded)
      setPickedPixel(null) // сбрасываем пипетку при новой картинке
    } catch (err) {
      alert('Не удалось открыть файл: ' + err.message)
    }
  }

  async function handleSave(format) {
    if (!image) return
    try {
      await saveImageFile(image, format)
    } catch (err) {
      alert('Не удалось сохранить файл: ' + err.message)
    }
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopToolbar
        onOpenFile={handleOpenFile}
        onSave={handleSave}
        hasImage={Boolean(image)}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
      />
      <ImageCanvas image={image} activeTool={activeTool} onPick={setPickedPixel} />
      <StatusBar image={image} pickedPixel={pickedPixel} />
    </Box>
  )
}